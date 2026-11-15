import { WORDS, answerFor } from './data.js';
import { icon, confetti } from '../../shared/art.js';
import { replaceView, gameHeading } from '../../shared/ui.js';
export function mount(root,{audio}) {
 let index=0,solved=false,tried=[],message='Tocá la letra que falta.';
 function render(){const item=WORDS[index];replaceView(root,`<section class="game words-game"><div class="game-heading">${gameHeading('Palabras amigas', 'game-title')}<p class="level-note">${index+1} de ${WORDS.length}</p></div><div class="words-paper"><div class="words-symbol" aria-hidden="true">${item.symbol}</div><p class="words-clue">${item.clue}</p><button class="secondary-button words-listen" data-action="listen">${icon('sound')} Escuchar palabra</button><div class="words-line" aria-label="${solved?item.word:item.word.split('').map((letter,i)=>i===item.missing?'espacio':letter).join(' ')}">${item.word.split('').map((letter,i)=>`<span class="words-letter ${i===item.missing?'words-gap':''} ${solved?'is-solved':''}">${i===item.missing&&!solved?'_':letter}</span>`).join('')}</div><div class="words-choices" role="group" aria-label="Elegí la letra que falta">${item.choices.map(letter=>`<button data-letter="${letter}" data-focus="letter-${letter}" ${solved||tried.includes(letter)?'disabled':''} aria-label="Letra ${letter}">${letter}</button>`).join('')}</div><p class="words-message" role="status">${message}</p>${solved?`<button class="primary-button" data-action="next">${index===WORDS.length-1?'¡Jugar otra vez!':'Otra palabra'} ${icon('arrow')}</button>`:''}</div>${solved?confetti():''}</section>`);}
 function click(e){const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.action==='listen'){audio.play(`word-${index}`);return;}
 if(b.dataset.action==='next'){index=(index+1)%WORDS.length;solved=false;tried=[];message='Tocá la letra que falta.';audio.stop();render();return;}
 if(b.dataset.letter){if(b.dataset.letter===answerFor(WORDS[index])){solved=true;message=`¡Sí! ${WORDS[index].word}. ¡Lo lograste!`;audio.play('celebrate');}else{tried.push(b.dataset.letter);message='Probemos con otra letra. ¡Vos podés!';audio.play('pop');}render();}}
 root.addEventListener('click',click);render();audio.intro();
  return()=>{root.removeEventListener('click',click);audio.stop();};
}
