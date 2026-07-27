/**
 * Point d'entrée de l'AUTOBOT.
 * Lance le panneau web de déploiement (auto.js) et le redémarre s'il crash.
 * Le bot Facebook lui-même (Goat.js) est démarré depuis le panneau,
 * une fois le cookie collé et les commandes sélectionnées.
 */

const { spawn } = require("child_process");
const path = require("path");

const SCRIPT_PATH = path.join(__dirname, "auto.js");

function start() {
	const main = spawn("node", [SCRIPT_PATH], {
		cwd: __dirname,
		stdio: "inherit",
		shell: false
	});

	main.on("close", (exitCode) => {
		if (exitCode === 0) {
			console.log("Panneau arrêté (code 0).");
		}
		else {
			console.log(`Panneau arrêté (code ${exitCode}). Redémarrage...`);
			setTimeout(start, 2000);
		}
	});
}

start();
