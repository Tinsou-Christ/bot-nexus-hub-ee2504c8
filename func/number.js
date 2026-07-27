const numbers = {
  bold: (text) => {
    if (text == null) return '';
    text = String(text);

    const boldMap = {
      '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒',
      '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return text.split('').map(char => boldMap[char] || char).join('');
  },

  italic: (text) => {
    if (text == null) return '';
    text = String(text);

    const italicMap = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
    };
    return text.split('').map(char => italicMap[char] || char).join('');
  },

  monospace: (text) => {
    if (text == null) return '';
    text = String(text);

    const monospaceMap = {
      '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺',
      '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿'
    };
    return text.split('').map(char => monospaceMap[char] || char).join('');
  },

  serif: (text) => {
    if (text == null) return '';
    text = String(text);

    const serifMap = {
      '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒',
      '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return text.split('').map(char => serifMap[char] || char).join('');
  },

  serifBold: (text) => {
    if (text == null) return '';
    text = String(text);

    const serifBoldMap = {
      '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰',
      '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(char => serifBoldMap[char] || char).join('');
  },

  sansSerif: (text) => {
    if (text == null) return '';
    text = String(text);

    const sansSerifMap = {
      '0': '𝟢', '1': '𝟣', '2': '𝟤', '3': '𝟥', '4': '𝟦',
      '5': '𝟧', '6': '𝟨', '7': '𝟩', '8': '𝟪', '9': '𝟫'
    };
    return text.split('').map(char => sansSerifMap[char] || char).join('');
  },

  sansSerifBold: (text) => {
    if (text == null) return '';
    text = String(text);

    const sansSerifBoldMap = {
      '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰',
      '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(char => sansSerifBoldMap[char] || char).join('');
  },

  outline: (text) => {
    if (text == null) return '';
    text = String(text);

    const outlineMap = {
      '0': '𝟘', '1': '𝟙', '2': '𝟚', '3': '𝟛', '4': '𝟜',
      '5': '𝟝', '6': '𝟞', '7': '𝟟', '8': '𝟠', '9': '𝟡'
    };
    return text.split('').map(char => outlineMap[char] || char).join('');
  },

  bubble: (text) => {
    if (text == null) return '';
    text = String(text);

    const bubbleMap = {
      '0': '⓪', '1': '①', '2': '②', '3': '③', '4': '④',
      '5': '⑤', '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨'
    };
    return text.split('').map(char => bubbleMap[char] || char).join('');
  },

  bubbleFilled: (text) => {
    if (text == null) return '';
    text = String(text);

    const bubbleFilledMap = {
      '0': '⓿', '1': '❶', '2': '❷', '3': '❸', '4': '❹',
      '5': '❺', '6': '❻', '7': '❼', '8': '❽', '9': '❾'
    };
    return text.split('').map(char => bubbleFilledMap[char] || char).join('');
  },

  square: (text) => {
    if (text == null) return '';
    text = String(text);

    const squareMap = {
      '0': '0⃣', '1': '1⃣', '2': '2⃣', '3': '3⃣', '4': '4⃣',
      '5': '5⃣', '6': '6⃣', '7': '7⃣', '8': '8⃣', '9': '9⃣'
    };
    return text.split('').map(char => squareMap[char] || char).join('');
  },

  fullwidth: (text) => {
    if (text == null) return '';
    text = String(text);

    const fullwidthMap = {
      '0': '０', '1': '１', '2': '２', '3': '３', '4': '４',
      '5': '５', '6': '６', '7': '７', '8': '８', '9': '９'
    };
    return text.split('').map(char => fullwidthMap[char] || char).join('');
  },

  superscript: (text) => {
    if (text == null) return '';
    text = String(text);

    const superscriptMap = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    return text.split('').map(char => superscriptMap[char] || char).join('');
  },

  subscript: (text) => {
    if (text == null) return '';
    text = String(text);

    const subscriptMap = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    return text.split('').map(char => subscriptMap[char] || char).join('');
  },

  roman: (text) => {
    if (text == null) return '';
    text = String(text);

    const romanMap = {
      '0': '0', '1': 'Ⅰ', '2': 'Ⅱ', '3': 'Ⅲ', '4': 'Ⅳ',
      '5': 'Ⅴ', '6': 'Ⅵ', '7': 'Ⅶ', '8': 'Ⅷ', '9': 'Ⅸ'
    };
    return text.split('').map(char => romanMap[char] || char).join('');
  },

  fraktur: (text) => {
    if (text == null) return '';
    text = String(text);

    const frakturMap = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
    };
    return text.split('').map(char => frakturMap[char] || char).join('');
  },

  format: (n, options = {}) => {
    const decimals = options.decimals != null ? options.decimals : 2;
    const compact = options.compact !== false;

    if (n == null || isNaN(n)) return '0';
    n = Number(n);
    if (!isFinite(n)) return 'infinity';

    const neg = n < 0 ? '-' : '';
    const abs = Math.abs(n);

    if (compact) {
      const scales = [
        { v: 1e15, s: 'Qa' }, { v: 1e12, s: 'T' }, { v: 1e9, s: 'B' },
        { v: 1e6, s: 'M' }, { v: 1e3, s: 'K' }
      ];
      const scale = scales.find(s => abs >= s.v);
      if (scale) {
        const value = (abs / scale.v).toFixed(2).replace(/\.00$/, '');
        return `${neg}${value}${scale.s}`;
      }
    }

    const isWhole = Number.isInteger(abs);
    const useDecimals = isWhole ? 0 : decimals;
    const parts = abs.toFixed(useDecimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${neg}${useDecimals > 0 ? parts.join('.') : parts[0]}`;
  },

  money: (n, fontType = 'bold', options = {}) => {
    const symbol = options.symbol != null ? options.symbol : '$';
    const formatted = numbers.format(n, options);
    return `${symbol}${numbers.apply(fontType, formatted)}`;
  },

  apply: (fontType, text) => {
    if (text == null) return '';
    text = String(text);

    if (typeof numbers[fontType] === 'function') {
      return numbers[fontType](text);
    }
    return text;
  },

  list: () => {
    return Object.keys(numbers).filter(key => typeof numbers[key] === 'function' && key !== 'apply' && key !== 'list' && key !== 'format' && key !== 'money');
  }
};

module.exports = numbers;

