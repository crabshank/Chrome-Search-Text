var sct,ifrm,ifdoc,robs,docText,res,txta,patEl,plainSearch,caseInsens,res_sct;

function rsz(){
	ifrm.style.setProperty( 'width', `${ifdoc.body.scrollWidth}px`, 'important' );
	sct.style.setProperty( 'width', `${ifrm.getBoundingClientRect().width}px`, 'important' );
	res_sct.style.setProperty( 'max-height', `${window.screen.availHeight}px`, 'important' );
}

function elRemover(el){
	if(typeof el!=='undefined' && !!el){
	if(typeof el.parentNode!=='undefined' && !!el.parentNode){
		el.parentNode.removeChild(el);
	}
	}
}

function getMatchingNodesShadow_order(docm, slc, isNodeName, onlyShadowRoots){
	
	function keepMatchesShadow(els,slcArr,isNodeName){
	   if(slcArr[0]===false){
		  return els;
	   }else{
			let out=[];
			for(let i=0, len=els.length; i<len; i++){
			  let n=els[i];
					for(let k=0, len_k=slcArr.length; k<len_k; k++){
						let sk=slcArr[k];
						if(isNodeName){
							if((n.nodeName.toLocaleLowerCase())===sk){
								out.push(n);
							}
						}else{ //selector
							   if(!!n.matches && typeof n.matches!=='undefined' && n.matches(sk)){
								  out.push(n);
							   }
						}
					}
			}
			return out;
		}
	}

	let slcArr=[];
	if(typeof(slc)==='string'){
		slc=(isNodeName && slc!==false)?(slc.toLocaleLowerCase()):slc;
		slcArr=[slc];
	}else if(typeof(slc[0])!=='undefined'){
		for(let i=0, len=slc.length; i<len; i++){
			let s=slc[i];
			slcArr.push((isNodeName && slc!==false)?(s.toLocaleLowerCase()):s)
		}
	}else{
		slcArr=[slc];
	}
	var shrc=[docm];
	var shrc_l=1;
	var out=[];
	let srCnt=0;

	while(srCnt<shrc_l){
		let curr=shrc[srCnt];
		let sh=(!!curr.shadowRoot && typeof curr.shadowRoot !=='undefined')?true:false;
		let nk=keepMatchesShadow([curr],slcArr,isNodeName);
		let nk_l=nk.length;
		
		if( !onlyShadowRoots && nk_l>0){
			for(let i=0; i<nk_l; i++){
				out.push(nk[i]);
			}
		}
		
        for(let i=curr.childNodes.length-1; i>=0; i--){
            shrc.splice(srCnt+1,0,curr.childNodes[i]);
		}
		
		if(sh){
			   let cs=curr.shadowRoot;
			   let csc=[...cs.childNodes];
			   if(onlyShadowRoots){
				  if(nk_l>0){
				   out.push({root:nk[0], childNodes:csc});
				  }
			   }
			   
                for(let i=csc.length-1; i>=0; i--){
                    shrc.splice(srCnt+1,0,csc[i]);
				}
		}

		srCnt++;
		shrc_l=shrc.length;
	}
	
	return out;
}

function getParent(el,elementsOnly,doc_head_body){
	if(!!el && typeof el!=='undefined'){
		let out=null;
		let curr=el;
		let end=false;
		
		while(!end){
			if(!!curr.parentNode && typeof curr.parentNode!=='undefined'){
				out=curr.parentNode;
				curr=out;
				end=(elementsOnly && out.nodeType!=1)?false:true;
			}else if(!!curr.parentElement && typeof curr.parentElement!=='undefined'){
					out=curr.parentElement;
					end=true;
					curr=out;
			}else if(!!curr.host && typeof curr.host!=='undefined'){
					out=curr.host;
					end=(elementsOnly && out.nodeType!=1)?false:true;
					curr=out;
			}else{
				out=null;
				end=true;
			}
		}
		
		if(out!==null){
			if(!doc_head_body){
				if(out.nodeName==='BODY' || out.nodeName==='HEAD' || out.nodeName==='HTML'){
					out=null;
				}
			}
		}
		
		return out;
	}else{
		return null;
	}
}

function getAncestors(el, elementsOnly, elToHTML, doc_head_body, notInShadow){
	let curr=el;
	let ancestors=[el];
	let outAncestors=[];
	let end=false;
	
	while(!end){
		let p=getParent(curr,elementsOnly,doc_head_body);
		if(p!==null){
			if(elToHTML){
				ancestors.push(p);
			}else{
				ancestors.unshift(p)
			}
			curr=p;
		}else{
			end=true;
		}
	}
	if(notInShadow){
		if(elToHTML){
			for(let i=ancestors.length-1; i>=0; i--){
				outAncestors.unshift(ancestors[i]);
				if(!!ancestors[i].shadowRoot && typeof ancestors[i].shadowRoot !=='undefined'){
					i=0;
				}
			}
		}else{
			for(let i=0, len=ancestors.length; i<len; i++){
				outAncestors.push(ancestors[i]);
				if(!!ancestors[i].shadowRoot && typeof ancestors[i].shadowRoot !=='undefined'){
					i=len-1;
				}
			}
		}
	}else{
		outAncestors=ancestors;
	}
	return outAncestors;
}

function getScrollY(anc){
	let ty = [		window?.pageYOffset,
											window?.scrollY,
											document?.documentElement?.scrollTop,
											document?.body?.parentNode?.scrollTop,
											document?.body?.scrollTop,
											document?.head?.scrollTop,
											0
										];
		for(let k=0, len_k=anc.length; k<len_k; k++){
			ty.push(anc[k]?.scrollTop);
		}
	ty=ty.filter( (p)=>{return p>=0} );
										
	return Math.max(...ty);
}

function getSearchable(s){ //Return selectable text

	let sel= s!==false && typeof(s)!=='undefined' && s.trim()!=='' ? getMatchingNodesShadow_order(document,s,false,false) : [document.documentElement];
	if(sel===null && s!==false){
		alert('Invalid CSS selector!');
		return;
	}
	
    let txt=['',[]];
	for(let i=0, len_i=sel.length; i<len_i; i++){
		let el=sel[i];
		let n=getMatchingNodesShadow_order(el, '#text', true, false);
		for(let k=0, len_k=n.length; k<len_k; k++){
			let nk=n[k];
			let pp=nk.parentElement;
			let dtc=nk.textContent;
			txt[0]+=dtc;
			for(let i=0, len_i=dtc.length; i<len_i; i++){
				txt[1].push([pp,i,nk]);
			}
		}
	}
    return txt;
}

function findText(srch,pat,plain,case_insensitive){	//search for text; case-insenstive is only relevant when plain===true;
    let out=[];
	let str=srch[0];
	let byRes={};
    let brc=0;
    if(plain===true){
		let strRaw=str;
		let patRaw=pat;
		if(case_insensitive===true){
			str=str.toLocaleLowerCase();
			pat=pat.toLocaleLowerCase();
		}
        let a=str.indexOf(pat);
        let pl=pat.length;
        while(a!==-1){
			let ed=a+pl-1;
			let tx=pat;
			if(case_insensitive){
				tx='';
				 for(let i=a; i<=ed; i++){
					 tx+=strRaw[i];
				 }
			}
			let stl=srch[1][a][0];
			let stl_ih=stl.innerHTML;
			
			let op={text:tx, allEls:{starting:[stl,stl_ih], all:[]}, posRange:[a,ed]};
			let op1={allEls:{starting:[stl,stl_ih], all:[]}, posRange:[a,ed]};
				op1.index=out.length;
				
			//create marks
			let done_txn=[];
			let pels=[];
			let p0=op.posRange[0];
            let p1=op.posRange[1];
			for(let b=p0; b<=p1; ++b){
				let txb=srch[1][b];
				let txn=txb[2];
				let pel=txb[0];
				let doneIx=done_txn.findIndex(n=>{return n[0]===txn});
				if(doneIx===-1){
					op.allEls.all.push([pel,pel.innerHTML]);
					op1.allEls.all.push([pel,pel.innerHTML]);
					let mks=getMatchingNodesShadow_order(pel, 'mark', true, false);
					let markMap={};
					for(let m=0, len_m=mks.length; m<len_m; m++){
						let mk=mks[m];
						let m1=(m+1).toString();
						markMap[m1]=mk.className;
						mk.className=m1;
					}
					let txc=[...txn.textContent];
					let clss= b!==p0 ? '' : ' class="0"' ;
					txc[txb[1]]=`<mark${clss}>`+txc[txb[1]]+'</mark>';
					let pix=pels.findIndex(prl=>{return prl[0]===pel;});
					if(pix===-1){
						pels.push([pel,done_txn.length]);
					}else{
						pels[pix][1]=done_txn.length;
					}
					done_txn.push([txn,txc,pel,markMap]);
				}else{
					let txc=done_txn[doneIx][1];
					txc[txb[1]]='<mark>'+txc[txb[1]]+'</mark>';
					done_txn[doneIx][1]=txc;
				}
			}
			
			for(let i=0, len_i=done_txn.length; i<len_i; i++){
				let pp=done_txn[2];
				for(let i=0, len_i=done_txn.length; i<len_i; i++){
					
				}
			}
			
			op.resultMarks=[null,[]];
			op1.resultMarks=[null,[]];
			for(let i=0, len_i=done_txn.length; i<len_i; i++){
				let di=done_txn[i];
				di[0].textContent=di[1].join('');
				let ix=pels.findIndex(prl=>{return prl[0]===di[2];});
				if(i===pels[ix][1]){
					let classMarks=[...di[2].innerHTML.matchAll(/\&lt\;mark class\=\"([0-9]+)\"\&gt\;/g)];
					classMarks.forEach((c)=>{
						let c0=c[0];
						let c0_nw=c0.replaceAll('&lt;','<').replaceAll('&gt;','>');
						di[2].innerHTML=di[2].innerHTML.replaceAll(c0,c0_nw);
					});
					di[2].innerHTML=di[2].innerHTML.replaceAll('&lt;mark&gt;','<mark>').replaceAll('&lt;/mark&gt;','</mark>');
					
					let mks=getMatchingNodesShadow_order(di[2], 'mark', true, false);
					let mk0=mks.find(m=>{return m.className==='0'});
					let markMap=di[3];
					
					for(let m=0, len_m=mks.length; m<len_m; m++){
						let mk=mks[m];
						let m1=(m+1).toString();
						if(mk===mk0){
							mk.className='';
							op.resultMarks[0]=mk;
							op.resultMarks[1].push(mk);
							op1.resultMarks[0]=mk;
							op1.resultMarks[1].push(mk);
						}else if(typeof(markMap[m1])!=='undefined'){
							mk.className=markMap[m1];
						}else{
							op.resultMarks[1].push(mk);
							op1.resultMarks[1].push(mk);
						}
					}
				}
			}
			
		/*op.resultMarks[1]=op.resultMarks[1].filter(l=>{return getAncestors(l,true,true,true,true).includes(document.documentElement)===true;});
		op.resultMarks[1]=Array.from(new Set(op.resultMarks[1]));
		op.resultMarks[0]=op.resultMarks[1][0];
		op1.resultMarks[0]=op.resultMarks[0];
		op1.resultMarks[1]=op.resultMarks[1];
		
		op.allEls.all=op.allEls.all.filter(l=>{return getAncestors(l[0],true,true,true,true).includes(document.documentElement)===true;});
		op.allEls.all=Array.from(new Set(op.allEls.all));
		op.allEls.starting=op.allEls.all[0];
		op1.allEls.all=op.allEls.all;
		op1.allEls.starting=	op.allEls.starting;*/
			
			if(typeof(byRes[tx])==='undefined'){
				byRes[tx]=[op1];
                brc++;
			}else{
				byRes[tx].push(op1);
			}
            out.push(op);
            a=str.indexOf(pat,a+pl);
        }
    }else{ //regex
        let a=[...str.matchAll(pat)];
        for(let i=0, len_i=a.length; i<len_i; i++){
            let ai=a[i];
            let ai0=ai[0];
            let aix=ai.index;
			let stl=srch[1][aix][0];
			let stl_ih=stl.innerHTML;

			let op={text:ai0, allEls:{starting:[stl,stl_ih], all:[]}, posRange:[aix,aix+ai0.length-1]};
			let op1={allEls:{starting:[stl,stl_ih], all:[]}, posRange:[aix,aix+ai0.length-1]};
				op1.index=out.length;
				
			//create marks
			let done_txn=[];
			let pels=[];
			let p0=op.posRange[0];
            let p1=op.posRange[1];
			for(let b=p0; b<=p1; ++b){
				let txb=srch[1][b];
				let txn=txb[2];
				let pel=txb[0];
				let doneIx=done_txn.findIndex(n=>{return n[0]===txn});
				if(doneIx===-1){
					op.allEls.all.push([pel,pel.innerHTML]);
					op1.allEls.all.push([pel,pel.innerHTML]);
					let mks=getMatchingNodesShadow_order(pel, 'mark', true, false);
					let markMap={};
					for(let m=0, len_m=mks.length; m<len_m; m++){
						let mk=mks[m];
						let m1=(m+1).toString();
						markMap[m1]=mk.className;
						mk.className=m1;
					}
					let txc=[...txn.textContent];
					let clss= b!==p0 ? '' : ' class="0"' ;
					txc[txb[1]]=`<mark${clss}>`+txc[txb[1]]+'</mark>';
					let pix=pels.findIndex(prl=>{return prl[0]===pel;});
					if(pix===-1){
						pels.push([pel,done_txn.length]);
					}else{
						pels[pix][1]=done_txn.length;
					}
					done_txn.push([txn,txc,pel,markMap]);
				}else{
					let txc=done_txn[doneIx][1];
					txc[txb[1]]='<mark>'+txc[txb[1]]+'</mark>';
					done_txn[doneIx][1]=txc;
				}
			}
			
			op.resultMarks=[null,[]];
			op1.resultMarks=[null,[]];
			for(let i=0, len_i=done_txn.length; i<len_i; i++){
				let di=done_txn[i];
				di[0].textContent=di[1].join('');
				let ix=pels.findIndex(prl=>{return prl[0]===di[2];});
				if(i===pels[ix][1]){
					let classMarks=[...di[2].innerHTML.matchAll(/\&lt\;mark class\=\"([0-9]+)\"\&gt\;/g)];
					classMarks.forEach((c)=>{
						let c0=c[0];
						let c0_nw=c0.replaceAll('&lt;','<').replaceAll('&gt;','>');	
						di[2].innerHTML=di[2].innerHTML.replaceAll(c0,c0_nw);
					});
					di[2].innerHTML=di[2].innerHTML.replaceAll('&lt;mark&gt;','<mark>').replaceAll('&lt;/mark&gt;','</mark>');
					
					let mks=getMatchingNodesShadow_order(di[2], 'mark', true, false);
					let mk0=mks.find(m=>{return m.className==='0'});
					let markMap=di[3];
					
					for(let m=0, len_m=mks.length; m<len_m; m++){
						let mk=mks[m];
						let m1=(m+1).toString();
						if(mk===mk0){
							mk.className='';
							op.resultMarks[0]=mk;
							op.resultMarks[1].push(mk);
							op1.resultMarks[0]=mk;
							op1.resultMarks[1].push(mk);
						}else if(typeof(markMap[m1])!=='undefined'){
							mk.className=markMap[m1];
						}else{
							op.resultMarks[1].push(mk);
							op1.resultMarks[1].push(mk);
						}
					}
				}
			}
			
		/*op.resultMarks[1]=op.resultMarks[1].filter(l=>{return getAncestors(l,true,true,true,true).includes(document.documentElement)===true;});
		op.resultMarks[1]=Array.from(new Set(op.resultMarks[1]));
		op.resultMarks[0]=op.resultMarks[1][0];
		op1.resultMarks[0]=op.resultMarks[0];
		op1.resultMarks[1]=op.resultMarks[1];
		
		op.allEls.all=op.allEls.all.filter(l=>{return getAncestors(l[0],true,true,true,true).includes(document.documentElement)===true;});
		op.allEls.all=Array.from(new Set(op.allEls.all));
		op.allEls.starting=op.allEls.all[0];
		op1.allEls.all=op.allEls.all;
		op1.allEls.starting=	op.allEls.starting;*/
			
			if(typeof(byRes[ai0])==='undefined'){
				byRes[ai0]=[op1];
                brc++;
			}else{
				byRes[ai0].push(op1);
			}
            out.push(op);
        }
    }

	out.byResult=byRes;
    out.byResult_count=brc;
	out.docText=srch;
	
	out.replaceText=function(w,i,endBias){ //w = string to replace pattern-matching sub-strings with (use '*' to insert the found substring, and '\\*' to print an asterisk); i = the result to replace, if undefined or null, all will be replaced!; if endBias===true, the replacement text will be entered into the text node of the last character of the result
		if(!(i>=0 && i<this.length) && typeof(i)!=='undefined' && i!==null){
			console.error(`Argument must be between 0 and ${this.length-1}, undefined, or null!`);
			return;
		}

		let j=i;
		if(typeof(i)==='undefined' || i===null){
			i=0;
			j=this.length-1;
		}
		
		for(let a=i; a<=j; ++a){
			let ra=this[a];
			let done_txn=[];
			let spw=w.split(/(?<!\\)\*/).join(ra.text).split('\\*').join('*');
			let p0=ra.posRange[0];
            let p1=ra.posRange[1];
			for(let b=p0; b<=p1; ++b){
				let txb=this.docText[1][b];
				let txn=txb[2];
				let doneIx=done_txn.findIndex(n=>{return n[0]===txn});
				if(doneIx===-1){
					let txc=[...txn.textContent];
                    
					txc[txb[1]]=( (b===p0 && endBias!==true) || (b===p1 && endBias===true) )? spw : '';
					done_txn.push([txn,txc]);
				}else{
					let txc=done_txn[doneIx][1];
					txc[txb[1]]= b===p1 && endBias===true ? spw : '';
					done_txn[doneIx][1]=txc;
				}
			}
			
			for(let i=0, len_i=done_txn.length; i<len_i; i++){
				let di=done_txn[i];
				di[0].textContent=di[1].join('');
			}
		}
	}
	
	out.jump=function(i){
		if(!(i>=0 && i<this.length)){
			console.error(`Argument must be between 0 and ${this.length-1}!`);
			return;
		}
		let ti=this[i];
		let el=ti.resultMarks[0];
		let out=null;
		let anc=getAncestors(el,true,true,false,true);
		 for(let i=0, len_i=anc.length; i<len_i; i++){
			let sy=getScrollY(anc);
			anc[i].scrollIntoView({behavior: "instant", block: 'center', inline: "start"});
			let sy2=getScrollY(anc);
			if(sy!==sy2){
				out=anc[i];
				break;
			}
		}
		if(out!==null){
			let rmks=ti.resultMarks[1];
			rmks.forEach(r=>{
				r.style.cssText='filter: invert(1) !important;';
			});
			setTimeout(() => {
				rmks.forEach(r=>{
					r.style.cssText='';
				});
			}, "3000");
		}
	}	
	
	out.revert_hl=function(i){ //Revert changes due to the findText function
		if(!(i>=0 && i<this.length) && typeof(i)!=='undefined' && i!==null){
			console.error(`Argument must be between 0 and ${this.length-1}, undefined, or null!`);
			return;
		}

		let j=i;
		if(typeof(i)==='undefined' || i===null){
			i=0;
			j=this.length-1;
		}
		
		for(let a=i; a<=j; ++a){
			let ra=this[a];
			let els=ra.allEls.all;
			els.forEach(l=>{
				l[0].innerHTML=l[1];
			});
		}
	}
    return out;
}

let fs={
	setupPatt: (s)=>{
		sct=document.createElement('section');
		document.body.insertAdjacentElement('beforeend',sct);
		sct.style.setProperty( 'z-index', Number.MAX_SAFE_INTEGER, 'important' );
		sct.style.setProperty( 'display', 'inline-block','important' );
		sct.style.setProperty( 'top', '0px', 'important' );
		sct.style.setProperty( 'right', '0px', 'important' );
		sct.style.setProperty( 'height', '100%', 'important' );
		sct.style.setProperty( 'position', 'fixed', 'important' );
		sct.style.setProperty( 'margin', 0, 'important' );
		sct.style.setProperty( 'border', 0, 'important' );
		sct.style.setProperty( 'padding', 0, 'important' );

		ifrm=document.createElement('iframe');
		sct.insertAdjacentElement('afterbegin',ifrm);
		ifdoc=ifrm.contentWindow.document;
		ifrm.style.setProperty( 'width', `${ifdoc.body.scrollWidth}px`, 'important' );
		ifrm.style.setProperty( 'height', '100%', 'important' );
		ifrm.style.setProperty( 'float', 'right', 'important' );
		ifdoc.body.style.cssText='background: rgb(51, 51, 51) !important; margin: 0px !important; border: 0px !important; padding: 0px !important; overflow: hidden !important; height: max-content !important;'
		ifdoc.body.innerHTML=`
		<section style="display: flex; flex-direction: row; place-items: flex-start;"> <div id="selText" style="border:buttonface; border-width: 0.28ch; border-style: groove; padding: 0.2ch;min-width: 16.9ch;" title="Enter search pattern (regex, without bounding forward slashes/plaintext)" contenteditable=""></div><section style="display: flex; flex-direction:column;"><section style="display: flex;flex-direction: row;"><input type="checkbox" title="Regex, by default" id="plainSearch" style="place-self: center"><span style="text-wrap: nowrap;align-self: center;" title="Regex, by default">Plain text</span></section><section style="display: flex;flex-direction: row;"><input type="checkbox" id="caseInsens" style="place-self: center"><span style="text-wrap: nowrap;align-self: center;">Case-insensitive</span></section></section><button id="closeFrame" style="width: 4.3ch;color: red;background: black;border: 1px buttonface outset;margin-left: 0.02ch;">❌</button></section>
		<textarea id="txta" title="Enter unique selector of element within which the text will be marked" placeholder="Enter CSS selector here: " style="min-height: min-content;"></textarea><br>
		<button style="white-space: nowrap; margin-top: 0.27em;" id="pattSearch">Search pattern!</button>
		</section>
		<section id="results" style="display: flex; flex-direction: column;max-height:${window.screen.availHeight}px;overflow-y: scroll;overflow-x: hidden;"></section>`;
		
		txta=ifdoc.getElementById('txta');
		patEl=ifdoc.getElementById('selText');
		plainSearch= ifdoc.getElementById('plainSearch');
		caseInsens= ifdoc.getElementById('caseInsens');
		res_sct= ifdoc.getElementById('results');
		rsz();
		ifdoc.body.onclick=(e)=>{
			let t=e.target;
			if(t.id==='pattSearch'){ //Do search
				if(typeof(res)!=='undefined'){
					res.revert_hl();
				}
				docText=getSearchable(txta.value); 
				let isPlain= plainSearch.checked ? true : false ;
				let isCaseInsens= caseInsens.checked ? true : false ;
				let p= isPlain ? patEl.innerText : new RegExp(patEl.innerText, (isCaseInsens ? "gi" : "g"));
				if(isPlain){
					res=findText(docText,patEl.innerText,true,isCaseInsens);
				}else{ //regex
					res=findText(docText,new RegExp(patEl.innerText, (isCaseInsens ? "gi" : "g")));
				}
					console.log(res);
				for(let i=0, len=res.length; i<len; i++){
					let ri=res[i];
					let rin=ri.allEls.starting[0];
					let rid=rin.id.trim()!=='' ? `[id="${rin.id}"]` : ''; 
					let ricl=rin.className.trim()!=='' ? `[class="${rin.className}"]` : ''; 
					let ht=`<section ix="${i}"><div class="nodeSel">${rin.nodeName.toLocaleLowerCase()}${rid}${ricl}</div><div class="resText">${ri.text}</div><button class="jumpTo" jix="${i}">Jump</button></section>`;
					res_sct.insertAdjacentHTML('beforeend',ht);
				}
			}else if(t.className==='jumpTo'){
				let ix=parseInt(t.getAttribute('jix'));
				res.jump(ix);
			}else if(t.id==='closeFrame'){
				res.revert_hl();
				robs.disconnect();
				elRemover(sct);
			}
		}
		
		robs = new ResizeObserver(entries => {
			for (let entry of entries) {
				let cr = entry.contentRect;
				if(entry.target===ifdoc.body){
					rsz();
				}
			}
		});

		robs.observe(ifdoc.body);
	}
}
function gotMessage(message, sender, sendResponse) {
    let m=message.message;
	console.log(message);
	if(m==='getStatus'){ //Send back whether the page is already marked
		chrome.runtime.sendMessage({
                        message: 'hi'
				}, function(response) {;});
	}else{
		fs[m[0]](m[1]);
	}
}

chrome.runtime.onMessage.addListener(gotMessage);