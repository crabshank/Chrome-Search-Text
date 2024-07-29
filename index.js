send('getStatus');

let spt=document.getElementById('setupPatt');
let frms=document.getElementById('frms');

function sortByArrCols(arr, colsArr, dir){
    arr.sort(sortFunction);
		function sortFunction(a, b) {
			for(let i = 0; i < arr.length; i++){
					if(a[colsArr[i]]>b[colsArr[i]]){
						return dir[i]*-1;
					}else if(a[colsArr[i]]<b[colsArr[i]]){
						return dir[i]*1;
					}else if(i==arr.length-1){
					return 0;
				}
			} 
	}
}

window.onclick=(e)=>{
	t=e.target;
	if(t===spt){
		send([t.id,null]);
		window.close();
	}
};

function send(message) {

    let params = {
      active: true,
      currentWindow: true
    }
    chrome.tabs.query(params, gotTabs);

    function gotTabs(tabs) {
		let tid=tabs[0].id;
      let msg = {
        message: message,
		tabId: tid,
        title:tabs[0].title
      };
	  if(frms.childElementCount>0){
		chrome.tabs.sendMessage(tid, msg,{frameId: parseInt(frms[frms.selectedIndex].getAttribute('fid'))});
	  }else{
		  chrome.tabs.sendMessage(tid, msg);
	  }
    }

}

frms.oninput=(e)=>{
	let p=frms[frms.selectedIndex];
	let m=p.getAttribute('marked');
	if(m=='1'){
		mkp.style.display='none';
		mkps.style.display='none';
		txtar.style.display='none';
		spt.style.display='';
	}else{
		mkp.style.display='';
		mkps.style.display='';
		txtar.style.display='';
		spt.style.display='none';
	}
}
 
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    let m=message.message;
	let fch=[...frms.children];
	let fids=sender.frameId.toString();
	let fnd=false;
	let toSort=[];
	fch.forEach(f => {
		let srt=[];
		if(f.getAttribute('fid')==fids){
			srt=[f,sender.frameId];
			fnd=true;
			f.setAttribute('loc', sender.url);
			if(m==='marked'){
				f.setAttribute('marked', 1);
				srt.push(1);
			}else{
				f.setAttribute('marked', 0);
				srt.push(0);
			}
			f.innerHTML=`Frame ${fids}: ${sender.url}`;
		}else{
			srt=[f,parseInt(f.getAttribute('fid')),parseInt(f.getAttribute('marked'))];
		}
		toSort.push(srt);
	});
	if(fnd===false){
		let p=document.createElement('option');
		frms.appendChild(p);
		let srt=[p,sender.frameId];
		p.setAttribute('fid', sender.frameId);
		p.setAttribute('loc', sender.url);
		if(m==='marked'){
			p.setAttribute('marked', 1);
			srt.push(1);
		}else{
			p.setAttribute('marked', 0);
			srt.push(0);
		}
		p.innerHTML=`Frame ${fids}: ${sender.url}`;
		toSort.push(srt);
	}
	sortByArrCols(toSort,[2,1],[1,-1]);
	toSort.forEach(f =>{
		frms.insertAdjacentElement('beforeend',f[0]);
	});
	frms.selectedIndex=0;
	frms.dispatchEvent(new Event('input'));
});
