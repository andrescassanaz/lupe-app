export const WORDS = [
 {word:'LUPE',missing:1,clue:'Tu nombre',symbol:'🌼',choices:['U','A','O']},
 {word:'MAMÁ',missing:0,clue:'La familia',symbol:'💕',choices:['P','M','S']},
 {word:'PAPÁ',missing:0,clue:'La familia',symbol:'💕',choices:['P','L','T']},
 {word:'SOL',missing:1,clue:'Brilla en el cielo',symbol:'☀️',choices:['A','O','U']},
 {word:'LUNA',missing:2,clue:'Sale de noche',symbol:'🌙',choices:['M','P','N']},
 {word:'GATO',missing:0,clue:'Hace miau',symbol:'🐱',choices:['G','P','S']},
 {word:'CASA',missing:1,clue:'Donde vivimos',symbol:'🏠',choices:['O','U','A']},
 {word:'OSO',missing:0,clue:'Un amigo peludito',symbol:'🐻',choices:['E','O','A']},
 {word:'MESA',missing:2,clue:'Para sentarnos a comer',symbol:'🍽️',choices:['S','L','T']},
 {word:'PATO',missing:2,clue:'Hace cuac',symbol:'🦆',choices:['P','T','M']},
 {word:'MANO',missing:1,clue:'Para saludar',symbol:'👋',choices:['E','A','U']},
 {word:'AGUA',missing:2,clue:'Para tomar',symbol:'💧',choices:['O','A','U']},
];
export function answerFor(item){return item.word[item.missing];}
