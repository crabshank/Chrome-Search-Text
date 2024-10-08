var sct=null;
var resShowing=false;
var allReplaced=false;
var anyReplaced=[];
var isMinimised=false;
var res,ifrm,ifdoc,robs,docText,txta,patEl,plainSearch,caseInsens,res_sct, unic,expRes,markCol,markStyl;

function rsz(){
	ifrm.style.setProperty( 'width', `${ifdoc.body.scrollWidth}px`, 'important' );
	sct.style.setProperty( 'width', `${ifrm.getBoundingClientRect().width}px`, 'important' );
	res_sct.style.setProperty( 'max-height', `${sct.getBoundingClientRect().height-res_sct.getBoundingClientRect().top-6	}px`, 'important' );
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
	let txns=[];
	for(let i=0, len_i=sel.length; i<len_i; i++){
		let el=sel[i];
		let n=getMatchingNodesShadow_order(el, '#text', true, false);
        let st=0;
        for(let k=0, len_k=n.length; k<len_k; k++){
            let nk=n[k];
			if( typeof(txns.find(t=>{return t===nk;})) === 'undefined'){
				txns.push(nk);
				let pp=nk.parentElement;
				let dtc=nk.textContent;
				txt[0]+=dtc;
				for(let i=0, len_i=dtc.length; i<len_i; i++){
					txt[1].push([pp,i,nk,st]);
				}
				st+=dtc.length;
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
	let a=[];
    if(plain===true){
		let strRaw=str;
		let patRaw=pat;
		if(case_insensitive===true){
			str=str.toLocaleLowerCase();
			pat=pat.toLocaleLowerCase();
		}
        let b=str.indexOf(pat);
        let pl=pat.length;
		let done_txn=[];
		let pels=[];
        while(b!==-1){
			let ed=b+pl-1;
			let tx=pat;
			if(case_insensitive){
				tx='';
				 for(let i=b; i<=ed; i++){
					 tx+=strRaw[i];
				 }
			}
			let sa=[tx];
			sa.index=b;
			a.push(sa);
			b=str.indexOf(pat,b+pl);
        }
    }else{ //regex
		a=[...str.matchAll(pat)];
	}
	
		let pels=[];
        let txns=[];
		for(let i=0, len_i=a.length; i<len_i; i++){
            let ai=a[i];
            let ai0=ai[0];
            let aix=ai.index;
			let stl=srch[1][aix][0];
			let stl_ih=stl.innerHTML;
			let op={text:ai0, allEls:{starting:[stl,stl_ih], all:[]}, posRange:[aix,aix+ai0.length-1]};

            op.resultMarks=[null,[]];

			//create marks
			let p0=op.posRange[0];
            let p1=op.posRange[1];
			for(let b=p0; b<=p1; ++b){
				let txb=srch[1][b];
				let txn=txb[2]; //text node
                let st=txb[3];
				let pel=txb[0]; //parent
                
                let als=op.allEls.all.findIndex(prl=>{return prl===pel;});
                if(als===-1){
					op.allEls.all.push([pel,pel.innerHTML]);
				}
                
                let pix=pels.findIndex(prl=>{return prl[0]===pel;});
				if(pix===-1){
					pels.push([pel,[i],[b],[txn]]);
				}else if(pels[pix][1].includes(i)===false){
					pels[pix][1].push(i); //res indexes per parent
					pels[pix][2].push(b);
                    if(pels[pix][3].includes(txn)===false){ pels[pix][3].push(txn) }
				}else{
                    pels[pix][2].push(b);
                    if(pels[pix][3].includes(txn)===false){ pels[pix][3].push(txn) }
                }
                
                let tix=txns.findIndex(tn=>{return tn[0]===txn;});
				if(tix===-1){
					txns.push([txn,[i],[b],st]);
				}else if(txns[tix][1].includes(i)===false){
					txns[tix][1].push(i); //res indexes per text node
                    txns[tix][2].push(b); 
				}else{
                    txns[tix][2].push(b);
                }
            }
            out.push(op);
        }
        out.byParent=pels.map(p=>{return [p[0],p[1]]});
        for(let i=0, len_i=pels.length; i<len_i; i++){
                let pelsi=pels[i];
                let pel=pelsi[0];
                let mks=getMatchingNodesShadow_order(pel, 'mark', true, false);
				let markMap={};
					for(let m=0, len_m=mks.length; m<len_m; m++){
						let mk=mks[m];
						let m1=(-1*(m+1)).toString();
						markMap[m1]=mk.className;
						mk.className=m1;
                    }
                    pels[i].push(markMap);
        }
        
        for(let i=0, len_i=pels.length; i<len_i; i++){ //loop over parents
            let nw=[];
            for(let k=0, len_k=pels[i][3].length; k<len_k; k++){ //loop over each parent's text nodes
                
                let nd=pels[i][3][k];
                for(let j=0, len_j=txns.length; j<len_j; j++){
            let tj=txns[j];
            if(tj[0]===nd){
                nw.push(j);
            }
            
            }
            }
            pels[i][3]=nw;
        }
        
        for(let i=0, len_i=pels.length; i<len_i; i++){
            let pi=pels[i];
            let p0=pi[0];
            let ptx=pi[3];
            for(let j=0, len_j=ptx.length; j<len_j; j++){ //loop over each text node for this parent
                let pj=ptx[j];
                let tj=txns[pj];
                let txc=[...tj[0].textContent];
                let tjm=tj[2];
                let st=tj[3];
                let tjm0=tjm[0];
                
                for(let b=0, len_b=tjm.length; b<len_b; b++){
                    let tjmb=tjm[b];
                    txc[tjmb-st]=`<mark class="${tjmb}">${srch[0][tjmb]}</mark>`;
                }
                txns[pj][0].textContent=txc.join('');
            }
        }
        
        let mks2=[];
        for(let i=0, len_i=pels.length; i<len_i; i++){
            let p0=pels[i][0];
            let classMarks=[...p0.innerHTML.matchAll(/\&lt\;mark class\=\"(\-?[0-9]+)\"\&gt\;/g)];
				classMarks.forEach((c)=>{
					let c0=c[0];
					let c0_nw=c0.replaceAll('&lt;','<').replaceAll('&gt;','>');	
					p0.innerHTML=p0.innerHTML.replaceAll(c0,c0_nw);
				});
				p0.innerHTML=p0.innerHTML.replaceAll('&lt;mark&gt;','<mark>').replaceAll('&lt;/mark&gt;','</mark>');
                
                let mks=getMatchingNodesShadow_order(p0, 'mark', true, false);
                
				let markMap=pels[i][4];
				
				for(let m=0, len_m=mks.length; m<len_m; m++){
                    let mk=mks[m];
                    let mc=mk.className;
                    if(typeof(markMap[mc])!=='undefined'){
						mk.className=markMap[mc];
					}else{
                        mks2.push(mk);
                    }
				}
			}
                
        
            for(let i=0, len_i=out.length; i<len_i; i++){
            let t=out[i];
            let t1=JSON.parse(JSON.stringify(t));
            t1.index=i;
            t1.allEls=t.allEls;
            t1.resultMarks=t.resultMarks;
            let ps=t.posRange;
            let p0=ps[0];
            let p1=ps[1];
            let mb=mks2.find(m=>{return m.className==p0.toString()});
            if(typeof(mb)!=='undefined'){
                mb.className='';
                out[i].resultMarks[0]=mb;
                out[i].resultMarks[1].push(mb);
            }
			for(let b=p0+1; b<=p1; ++b){
                mb=mks2.find(m=>{return m.className==b.toString()});
                if(typeof(mb)!=='undefined'){
                    mb.className='';
                    out[i].resultMarks[1].push(mb);
                }
            }
            
            let tx=t.text;
            if(typeof(byRes[tx])==='undefined'){
				byRes[tx]=[t1];
                brc++;
			}else{
				byRes[tx].push(t1);
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
			let mks=ra.resultMarks[1];
			let txc=[];
			if(endBias!==true){
				for(let i=1, len_i=mks.length; i<len_i; i++){
					try{
						mks[i].outerHTML='';
					}catch(e){;}
				}
				try{
						mks[0].outerHTML=spw;
				}catch(e){;}
			}else{
				for(let i=0, len_i=mks.length-1; i<len_i; i++){
					try{
						mks[i].outerHTML='';
					}catch(e){;}
				}
				try{
						mks.at(-1).outerHTML=spw;
				}catch(e){;}
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

function minimiseFrame(){
	sct.style.setProperty( 'display', 'none','important' );
	isMinimised=true;
}

function closeFrame(){
	if(anyReplaced.length>0 || allReplaced){
			if (confirm('Do you want to revert replacements?')) {
				if(typeof(res)!=='undefined'){
					if(allReplaced){
						res.revert_hl();
					}else{
						anyReplaced.forEach( r=>{
							res.revert_hl(r);
						});
					}
				}
			}
	}else{
		if(typeof(res)!=='undefined'){
			res.revert_hl();
		}
	}
	
	if(sct!==null){
		robs.disconnect();
		elRemover(sct);
		elRemover(markStyl);
		isMinimised=false;
		sct=null;
		resShowing=false;
		allReplaced=false;
		anyReplaced=[];
	}
}

let fs={
	setupPatt: (s)=>{
		if(isMinimised){
			sct.style.setProperty( 'display', 'inline-block','important' );
			isMinimised=false;
			return;
		}
		closeFrame();
		markStyl=document.createElement('style');
		markStyl.innerHTML='mark {background-color: #ffff00;}';
		document.head.insertAdjacentElement('afterbegin',markStyl);
		
		sct=document.createElement('section');
		document.body.insertAdjacentElement('beforeend',sct);
		sct.style.setProperty( 'z-index', Number.MAX_SAFE_INTEGER, 'important' );
		sct.style.setProperty( 'display', 'inline-block','important' );
		sct.style.setProperty( 'top', '0px', 'important' );
		sct.style.setProperty( 'right', '0px', 'important' );
		sct.style.setProperty( 'height', 'max-content', 'important' );
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
		ifdoc.body.style.cssText='background: rgb(51, 51, 51) !important; margin: 0px !important; border: 0px !important; padding: 0px !important; overflow: hidden !important; height: max-content !important; width: max-content !important;'
		ifdoc.body.innerHTML=`<style>* {color:white;} button { color:black !important; background: buttonface !important;height: fit-content;} section.resSct {display: flex; flex-direction: row; margin-left: 4px;vertical-align: top;text-overflow: clip;width: -webkit-fill-available;text-wrap: wrap; margin-bottom} section.resSct > *{align-items: self-end;margin-right: 1ch; text-wrap: nowrap;} textarea{resize:none; overflow: hidden;} section.replace {display: -webkit-box; -webkit-box-align: end;} section.replace span {margin-right: 0.40ch;}section.replace * {align-items: self-end;} .nodeSel{color: #00f2ff;font-weight: bold;}</style>
		<section style="display: flex; flex-direction: row; place-items: flex-start;"> <section><div id="selText" style="border:buttonface; border-width: 0.28ch; border-style: groove; padding: 0.2ch;min-width: 16.9ch;" title="Enter search pattern (regex, without bounding forward slashes/plaintext)" contenteditable=""></div><span title="Mark colour"><input id="markCol" type="color" style="width: 4.808ch !important;border: transparent;height: 3ch !important;padding: 0;background: transparent;margin: 0;margin-right: 0.175ch;">#FFFF00</span></section><section style="display: flex; flex-direction:column;"> <section style="display: flex;flex-direction: row;"><input type="checkbox" title="Regex, by default" id="plainSearch" style="place-self: center"><span style="text-wrap: nowrap;align-self: center;" title="Regex, by default">Plain text</span></section> <section style="display: flex;flex-direction: row;"><input type="checkbox" id="caseInsens" style="place-self: center"><span style="text-wrap: nowrap;align-self: center;">Case-insensitive</span></section> <section style="display: flex;flex-direction: row;"><input type="checkbox" id="unic" style="place-self: center"><span style="text-wrap: nowrap;align-self: center;">Unicode regex</span></section> </section><section style="display: flex; flex-direction: column;"><button id="minimiseFrame" style="font-weight: bolder;width: 4.3ch;border: 1px buttonface outset;margin-left: 0.02ch; margin-top: 0.07ch;" title="Hide frame, use the action button to make it show again.">🗕</button><button id="closeFrame" style="width: 4.3ch;color: red;background: black !important;border: 1px buttonface outset;margin-left: 0.02ch;">❌</button><button title="Expand/collapse search results" id="expRes" style="width: 4.3ch;border: 1px buttonface outset;margin-left: 0.02ch; margin-top: 0.07ch;">▼</button></section></section>
		<textarea id="txta" title="Enter unique selector of element within which the text will be marked" placeholder="Enter CSS selector here: " style="min-height: min-content;"></textarea><br>
		<button style="white-space: nowrap; margin-top: 0.27em;" id="pattSearch">Search pattern!</button>
		</section>
		<section id="results" style="margin-bottom: 0.2ch;visibility: hidden;display: flex; flex-direction: column;max-height:${sct.getBoundingClientRect().height}px;overflow-y: scroll;overflow-x: hidden;"></section>`;
		
		markCol=ifdoc.getElementById('markCol');
		markCol.value='#ffff00';
		txta=ifdoc.getElementById('txta');
		txta.style.minHeight=`${txta.scrollHeight}px`;
        unic=ifdoc.getElementById('unic');
        expRes=ifdoc.getElementById('expRes');

		patEl=ifdoc.getElementById('selText');

		plainSearch= ifdoc.getElementById('plainSearch');
		 ifdoc.body.oninput=(e)=>{
			let t=e.target;
			if(t.id==='markCol'){
				t.nextSibling.textContent=t.value.toLocaleUpperCase();
				markStyl.innerHTML=`mark {background-color: ${t.value};}`;
			}else if(t.tagName==='TEXTAREA'){
				t.style.height='min-content';
				t.style.height= t.value.trim()==='' ? '2.45ch' : t.scrollHeight+3;
				if(t===txta){
					 if(!resShowing){
						ifrm.style.height=res_sct.getBoundingClientRect().top+'px';
					}
				}
			}else if(t===plainSearch){
				if(plainSearch.checked){
					unic.parentElement.style.visibility='hidden';
				}else{
					unic.parentElement.style.visibility='visible';
				}
			}
        };
		
		caseInsens= ifdoc.getElementById('caseInsens');
		res_sct= ifdoc.getElementById('results');
        ifrm.style.height=res_sct.getBoundingClientRect().top+'px';
		rsz();
		ifdoc.body.onclick=(e)=>{
			let t=e.target;
			let tp=t.parentElement;
            if(t.classList.contains('replaceBtn')){
				tp.firstElementChild.style.display='flex';
				let ogOpen=t.getAttribute('open');
				t.setAttribute('open','true');
				if(t.id==='replaceAllBtn'){
					if(ogOpen=='true'){
						if (confirm('Are you sure that you want to replace all results?')) {
						  res.replaceText(tp.getElementsByTagName('TEXTAREA')[0].value,null,t.parentElement.getElementsByTagName('INPUT')[0].checked);
						  allReplaced=true;
						  anyReplaced=true;
						   res_sct.style.visibility='hidden';
							sct.style.setProperty( 'height', 'max-content', 'important' );
							ifrm.style.height=res_sct.getBoundingClientRect().top+'px';
							expRes.innerHTML='▼';
						}
					}
				}else{
					if(ogOpen=='true'){
						if (confirm('Are you sure that you want to replace this result?')) {	
							let ix=parseInt(tp.getAttribute('ix'));
							res.replaceText(tp.getElementsByTagName('TEXTAREA')[0].value,ix,t.parentElement.getElementsByTagName('INPUT')[0].checked);
							anyReplaced.push(ix); 
							let affct=[];
							let els=Array.from(new Set(res[ix].allEls.all.map(l=>{return l[0]})));
							els.forEach( l=>{
								let elx=res.byParent.find( p=>{return p[0]===l;} );
								affct.push(...elx[1]);
							});
							affct=Array.from(new Set(affct)).sort();
							let toHide=[];
							if(affct.length>1){
								let affct2=affct.filter(a=>{return a!==ix});
								if (confirm(`Replacing this result willl also affect ${affct2.length===1 ? 'result' : 'results' }: ${affct2.join(', ')}. Do you wish to continue?`)) {
									let rsct=[...res_sct.querySelectorAll('section.resSct')];
									toHide=rsct.filter(c=>{return affct2.includes(parseInt(c.getAttribute('ix')))});
									toHide.unshift(tp.parentElement);
								}
							}else{
								toHide=[tp.parentElement];
							}
							toHide.forEach( h=>{
								h.getElementsByClassName('jumpTo')[0].style.display='none';
								h.getElementsByClassName('revertBtn')[0].setAttribute('last',true);
								h.getElementsByClassName('replace')[0].style.display='none';
							});
						}
					}
				}
				
            }else if(t.classList.contains('revertBtn')){
				let ix=parseInt(tp.getAttribute('ix'));

				let affct=[];
				let els=Array.from(new Set(res[ix].allEls.all.map(l=>{return l[0]})));
				els.forEach( l=>{
					let elx=res.byParent.find( p=>{return p[0]===l;} );
					affct.push(...elx[1]);
				});
				affct=Array.from(new Set(affct)).sort();
				let toHide=[];
				if(affct.length>1){
					let affct2=affct.filter(a=>{return a!==ix});
					if (confirm(`Replacing this result willl also affect ${affct2.length===1 ? 'result' : 'results' }: ${affct2.join(', ')}. Do you wish to continue?`)) {
						res.revert_hl(ix);
						let rsct=[...res_sct.querySelectorAll('section.resSct')];
						toHide=rsct.filter(c=>{return affct2.includes(parseInt(c.getAttribute('ix')))});
						toHide.unshift(tp);
						toHide.forEach( h=>{
							h.style.display='none';
						});
					}
				}else{
					res.revert_hl(ix);
					let h=tp;
					h.style.display='none';
				}
	
            }else if(t.id==='expRes'){
                if(resShowing){ //hide
                    res_sct.style.visibility='hidden';
                    sct.style.setProperty( 'height', 'max-content', 'important' );
                            ifrm.style.height=res_sct.getBoundingClientRect().top+'px';
                    t.innerHTML='▼';
                }else if(!allReplaced){
                    res_sct.style.visibility='visible';
                    sct.style.setProperty( 'height', '100%', 'important' );
                    ifrm.style.height='100%';
					rsz();
                    t.innerHTML='▲';
                }
                resShowing=!resShowing;
			}else if(t.id==='pattSearch'){ //Do search
				if(typeof(res)!=='undefined'){
					res.revert_hl();
				}
				docText=getSearchable(txta.value); 
				let isPlain= plainSearch.checked ? true : false ;
				let isCaseInsens= caseInsens.checked ? true : false ;
                let isUnic= unic.checked ? true : false ;
                let rg=isUnic?'u':'';
				if(isPlain){
					res=findText(docText,patEl.innerText,true,isCaseInsens);
				}else{ //regex
					res=findText(docText,new RegExp(patEl.innerText, (isCaseInsens ? rg+"gi" : rg+"g")));
				}
					console.log(res);
					res_sct.innerHTML='';
					let ht=`<section id="replaceAll" class="replace" style="margin-top:2px;"><section style="display: none;"><textarea title="Use '*' to insert the found substring, and '\*' to print an asterisk (without quotes)" style="height: 2.45ch;"></textarea><span><input class="lastNode" type="checkbox"> Replace on last node</span></section> <button id="replaceAllBtn" class="replaceBtn" open="false">Replace all</button></section>`;
					res_sct.insertAdjacentHTML('beforeend',ht);
				for(let i=0, len=res.length; i<len; i++){
					let ri=res[i];
					let rin=ri.allEls.starting[0];
					let rid=rin.id.trim()!=='' ? `[id="${rin.id}"]` : ''; 
					let ricl=rin.className.trim()!=='' ? `[class="${rin.className}"]` : ''; 
					ht=`<section ix="${i}" class="resSct"><span class="index">[${i}]</span><div class="nodeSel">${rin.nodeName.toLocaleLowerCase()}${rid}${ricl}</div><div class="resText">${ri.text}</div><button class="jumpTo" jix="${i}">Jump</button><section ix="${i}" class="replace"><section style="display: none;"><textarea title="Use '*' to insert the found substring, and '\*' to print an asterisk (without quotes)" style="height: 2.45ch;"></textarea><span><input class="lastNode" type="checkbox"> Replace on last node</span></section><button class="replaceBtn" open="false">Replace</button></section> <button class="revertBtn" last="false">Revert</button></section>`;
					res_sct.insertAdjacentHTML('beforeend',ht);
				}
			}else if(t.className==='jumpTo'){
				let ix=parseInt(t.getAttribute('jix'));
				res.jump(ix);
			}else if(t.id==='minimiseFrame'){
				minimiseFrame();
			}else if(t.id==='closeFrame'){
				closeFrame();
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
	//console.log(message);
	if(m==='getStatus'){ //Send back whether the page is already marked
		chrome.runtime.sendMessage({
                        message: 'hi'
				}, function(response) {;});
	}else{
		fs[m[0]](m[1]);
	}
}

chrome.runtime.onMessage.addListener(gotMessage);