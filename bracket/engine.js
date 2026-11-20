(function(root){
const groups=[{name:'A',size:4,offset:0,points:[[65,65],[255,65],[255,230],[65,230]]},{name:'B',size:3,offset:4,points:[[160,50],[265,230],[55,230]]},{name:'C',size:3,offset:7,points:[[160,50],[265,230],[55,230]]},{name:'D',size:3,offset:10,points:[[160,50],[265,230],[55,230]]}];
function summary(state,g){const players=state.order.slice(g.offset,g.offset+g.size),wins=Object.fromEntries(players.map(p=>[p,0]));const games=players.map((p,i)=>({key:g.name+i,players:[p,players[(i+1)%players.length]],winner:state.results[g.name+i]??null}));for(const m of games)if(m.players.includes(m.winner))wins[m.winner]++;const complete=games.every(m=>m.players.includes(m.winner)),max=Math.max(...Object.values(wins)),leaders=players.filter(p=>wins[p]===max);return {players,wins,games,complete,leaders};}
function finalist(state,id){return id==='S1'?[state.qualifiers.A,state.qualifiers.B]:id==='S2'?[state.qualifiers.C,state.qualifiers.D]:[state.finals.S1,state.finals.S2];}
root.Cup={groups,summary,finalist};if(typeof module!=='undefined')module.exports=root.Cup;
})(typeof window==='undefined'?globalThis:window);
