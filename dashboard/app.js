const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

let lastCpuUsage = process.cpuUsage();
let lastCpuTime = Date.now();
let currentCpuUsagePercent = "0.0";

setInterval(() => {
    const currentCpuUsage = process.cpuUsage();
    const currentTime = Date.now();
    const userDiff = currentCpuUsage.user - lastCpuUsage.user;
    const systemDiff = currentCpuUsage.system - lastCpuUsage.system;
    const timeDiff = (currentTime - lastCpuTime) * 1000; 
    if (timeDiff > 0) {
        currentCpuUsagePercent = ((userDiff + systemDiff) / timeDiff * 100).toFixed(1);
    }
    lastCpuUsage = currentCpuUsage;
    lastCpuTime = currentTime;
}, 1000);



const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, "public")));

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    let str = "";
    if (d > 0) str += `${d}d `;
    if (h > 0) str += `${h}h `;
    if (m > 0) str += `${m}m `;
    str += `${s}s`;
    return str.trim();
}

app.get("/", (req, res) => {
    try {
        const templatePath = path.join(__dirname, "views", "admin_panel.html");
        let html = fs.readFileSync(templatePath, "utf-8");
        res.send(html);
    } catch (error) {
        res.status(500).send("Error loading dashboard: " + error.message);
    }
});

app.get("/api/stats", (req, res) => {
    const totalUsers = global.db && global.db.allUserData ? global.db.allUserData.length : 0;
    const totalThreads = global.db && global.db.allThreadData ? global.db.allThreadData.length : 0;
    const totalCommands = global.GoatBot && global.GoatBot.commands ? global.GoatBot.commands.size : 0;
    const uptimeSeconds = process.uptime();
    
    const memoryUsed = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const memoryMax = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2);
    
    let totalMembers = 0;
    if (global.db && global.db.allThreadData) {
        global.db.allThreadData.forEach(t => {
            if (t.members) totalMembers += t.members.length;
        });
    }

    let botVersion = "1.0.0";
    try {
        botVersion = require(path.join(process.cwd(), "package.json")).version;
    } catch(e) {}

    const cpuUsage = currentCpuUsagePercent;


    
    const osInfo = os.type() + " " + os.release();
    
    let totalPackages = 0;
    try {
        const pkg = require(path.join(process.cwd(), "package.json"));
        if(pkg.dependencies) totalPackages += Object.keys(pkg.dependencies).length;
        if(pkg.devDependencies) totalPackages += Object.keys(pkg.devDependencies).length;
    } catch(e) {}

    let storageInfo = "Unknown";
    try {
        if (fs.statfsSync) {
            const stat = fs.statfsSync(process.cwd());
            const totalGb = (stat.blocks * stat.bsize) / (1024 ** 3);
            const freeGb = (stat.bfree * stat.bsize) / (1024 ** 3);
            const usedGb = totalGb - freeGb;
            storageInfo = `${usedGb.toFixed(1)}GB / ${totalGb.toFixed(1)}GB`;
        }
    } catch(e) {}

    res.json({
        success: true,
        uptimeSeconds,
        memoryUsed,
        memoryMax,
        totalThreads,
        totalUsers,
        totalCommands,
        totalMembers,
        botVersion,
        cpuUsage,
        nodeVersion: process.version,

        osInfo,
        totalPackages,
        storageInfo
    });
});

app.get("/api/config", (req, res) => {
    try {
        const configPath = path.join(process.cwd(), "config.json");
        const data = fs.readFileSync(configPath, "utf-8");
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

app.post("/api/config", (req, res) => {
    try {
        const { configData } = req.body;
        JSON.parse(configData); 
        const configPath = path.join(process.cwd(), "config.json");
        fs.writeFileSync(configPath, configData, "utf-8");
        res.json({ success: true, message: "Config updated! Restart bot to apply." });
    } catch (e) {
        res.json({ success: false, message: "Invalid JSON or error saving: " + e.message });
    }
});

app.get("/api/threads", (req, res) => {
    if (global.db && global.db.allThreadData) {
        const threads = global.db.allThreadData.map(t => ({ id: t.threadID, name: t.threadName || "Unknown", members: t.members ? t.members.length : 0 }));
        res.json({ success: true, data: threads });
    } else res.json({ success: false, data: [] });
});

app.get("/api/users", (req, res) => {
    if (global.db && global.db.allUserData) {
        const users = global.db.allUserData.map(u => ({ id: u.userID, name: u.name || "Unknown" }));
        res.json({ success: true, data: users });
    } else res.json({ success: false, data: [] });
});

app.get("/api/commands", (req, res) => {
    let cmds = [];
    if (global.GoatBot && global.GoatBot.commands) {
        for (const [name, cmdObj] of global.GoatBot.commands.entries()) {
            cmds.push({
                name: name,
                category: (cmdObj.config && cmdObj.config.category) ? cmdObj.config.category : "uncategorized"
            });
        }
    }
    
    let events = [];
    if (global.GoatBot && global.GoatBot.events && global.GoatBot.events.size > 0) {
        for (const [name, eventObj] of global.GoatBot.events.entries()) {
            events.push({ name: name, category: "events" });
        }
    } else {
        try {
            const eventsPath = path.join(process.cwd(), "scripts", "events");
            if (fs.existsSync(eventsPath)) {
                const files = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));
                for (const f of files) {
                    events.push({ name: f.replace(".js", ""), category: "events" });
                }
            }
        } catch (e) {}
    }

    res.json({ success: true, data: cmds, events: events });
});

app.get("/api/command/:name", (req, res) => {
    try {
        const cmdPath = path.join(process.cwd(), "scripts", "cmds", req.params.name + ".js");
        if (fs.existsSync(cmdPath)) {
            const data = fs.readFileSync(cmdPath, "utf-8");
            res.json({ success: true, data });
        } else {
            res.json({ success: false, message: "File not found" });
        }
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

app.post("/api/command/:name", (req, res) => {
    try {
        const cmdPath = path.join(process.cwd(), "scripts", "cmds", req.params.name + ".js");
        const { code } = req.body;
        if (!code) return res.json({ success: false, message: "No code provided" });
        fs.writeFileSync(cmdPath, code, "utf-8");
        res.json({ success: true, message: "Command saved successfully! Reload command to apply." });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// --- FILE MANAGER API ---
app.post("/api/fs/list", (req, res) => {
    try {
        const targetPath = path.join(process.cwd(), req.body.path || "");
        if (!targetPath.startsWith(process.cwd())) return res.json({ success: false, message: "Access denied" });
        
        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) {
            const items = fs.readdirSync(targetPath).map(file => {
                const itemPath = path.join(targetPath, file);
                const isDir = fs.statSync(itemPath).isDirectory();
                return { name: file, isDir, path: path.relative(process.cwd(), itemPath) };
            });
            items.sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
            });
            res.json({ success: true, type: "dir", data: items, currentPath: path.relative(process.cwd(), targetPath) });
        } else {
            const data = fs.readFileSync(targetPath, "utf-8");
            res.json({ success: true, type: "file", data, currentPath: path.relative(process.cwd(), targetPath) });
        }
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

app.post("/api/fs/save", (req, res) => {
    try {
        const targetPath = path.join(process.cwd(), req.body.path);
        if (!targetPath.startsWith(process.cwd())) return res.json({ success: false, message: "Access denied" });
        fs.writeFileSync(targetPath, req.body.content, "utf-8");
        res.json({ success: true, message: "Saved successfully!" });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

app.post("/api/fs/rename", (req, res) => {
    try {
        const oldPath = path.join(process.cwd(), req.body.oldPath);
        const newPath = path.join(process.cwd(), req.body.newPath);
        if (!oldPath.startsWith(process.cwd()) || !newPath.startsWith(process.cwd())) return res.json({ success: false, message: "Access denied" });
        fs.renameSync(oldPath, newPath);
        res.json({ success: true, message: "Renamed successfully!" });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

app.post("/api/fs/delete", (req, res) => {
    try {
        const targetPath = path.join(process.cwd(), req.body.path);
        if (!targetPath.startsWith(process.cwd())) return res.json({ success: false, message: "Access denied" });
        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) fs.rmSync(targetPath, { recursive: true, force: true });
        else fs.unlinkSync(targetPath);
        res.json({ success: true, message: "Deleted successfully!" });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

app.post("/api/fs/create", (req, res) => {
    try {
        const targetPath = path.join(process.cwd(), req.body.path);
        if (!targetPath.startsWith(process.cwd())) return res.json({ success: false, message: "Access denied" });
        if (req.body.isDir) {
            fs.mkdirSync(targetPath, { recursive: true });
        } else {
            fs.writeFileSync(targetPath, "", "utf-8");
        }
        res.json({ success: true, message: "Created successfully!" });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

const MAX_LOGS = 200;
global.dashboardLogs = global.dashboardLogs || [];
if (!global.stdoutHooked) {
    const origStdout = process.stdout.write.bind(process.stdout);
    const origStderr = process.stderr.write.bind(process.stderr);
    
    function capture(chunk) {
        if (typeof chunk === 'string') {
            
            const cleanText = chunk.replace(/\x1b\[[0-9;]*m/g, '').trim();
            if (cleanText) {
                global.dashboardLogs.push({ time: new Date().toLocaleTimeString(), text: cleanText });
                if (global.dashboardLogs.length > MAX_LOGS) {
                    global.dashboardLogs.shift();
                }
            }
        }
    }
    
    process.stdout.write = (chunk, encoding, cb) => { capture(chunk); return origStdout(chunk, encoding, cb); };
    process.stderr.write = (chunk, encoding, cb) => { capture(chunk); return origStderr(chunk, encoding, cb); };
    global.stdoutHooked = true;
}

app.get("/api/logs", (req, res) => {
    res.json({ success: true, data: global.dashboardLogs || [] });
});

app.post("/api/update-cookie", (req, res) => {
    try {
        const { cookie } = req.body;
        if (!cookie) return res.json({ success: false, message: "Cookie is empty!" });
        
        // Write to account.txt and account.dev.txt
        const accountPath = path.join(process.cwd(), "account.txt");
        const accountDevPath = path.join(process.cwd(), "account.dev.txt");
        fs.writeFileSync(accountPath, cookie);
        fs.writeFileSync(accountDevPath, cookie);

        
        res.json({ success: true, message: "Cookie updated successfully! Restart the bot to apply." });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

app.post("/api/restart", (req, res) => {
    res.json({ success: true, message: "Restarting..." });
    setTimeout(() => {
        process.exit(2);
    }, 1000);
});

app.post("/api/stop", (req, res) => {
    res.json({ success: true, message: "Stopping bot..." });
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

app.post("/api/clear-cache", (req, res) => {
    try {
        if (global.client && global.client.cache) {
            global.client.cache = {};
        }

        const cacheDir = path.join(process.cwd(), "scripts", "cmds", "cache");
        if (fs.existsSync(cacheDir)) {
            const files = fs.readdirSync(cacheDir);
            for (const file of files) {
                const filePath = path.join(cacheDir, file);
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                } else if (fs.statSync(filePath).isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                }
            }
        }

        res.json({ success: true, message: "Cache cleared successfully!" });
    } catch (error) {
        res.json({ success: false, message: "Error clearing cache: " + error.message });
    }
});


module.exports = async (api) => {
    if (!api) {
        try { await require("./connectDB.js")(); } catch(e) {}
    }

    const PORT = process.env.PORT || (global.GoatBot && global.GoatBot.config && global.GoatBot.config.dashBoard ? global.GoatBot.config.dashBoard.port : 3001);
    
    server.listen(PORT, () => {
        console.log(`\x1b[32m[DASHBOARD]\x1b[0m Server is listening on port ${PORT}`);
    });
};
