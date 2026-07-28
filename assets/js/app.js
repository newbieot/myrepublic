(function(){
  'use strict';
  const CITIES=[{code:'29400',name:'BATAM'},{code:'10000',name:'JAKARTAPUSAT'},{code:'11000',name:'JAKARTABARAT'},{code:'12000',name:'JAKARTASELATAN'},{code:'13000',name:'JAKARTATIMUR'},{code:'14000',name:'JAKARTAUTARA'},{code:'20000',name:'MEDAN'}];
  const SUPPORTED=['html','htm','xlsx','xls','csv'];
  const state={files:[],records:[],nextId:1,query:'',filter:'all'};
  const $=id=>document.getElementById(id);
  const els={dropzone:$('dropzone'),fileInput:$('fileInput'),fileQueue:$('fileQueue'),queueCount:$('queueCount'),removeAll:$('removeAllFiles'),process:$('processFiles'),progressShell:$('progressShell'),progressLabel:$('progressLabel'),progressValue:$('progressValue'),progressBar:$('progressBar'),addManual:$('addManual'),clear:$('clearWorkspace'),search:$('recordSearch'),filter:$('statusFilter'),deleteSelected:$('deleteSelected'),recordsEmpty:$('recordsEmpty'),table:$('recordsTable'),tbody:$('recordsTable').querySelector('tbody'),selectAll:$('selectAll'),reviewCard:$('reviewCard'),total:$('totalCount'),ready:$('readyCount'),review:$('reviewCount'),invalid:$('invalidCount'),workspaceStatus:$('workspaceStatus'),previewBody:$('previewTable').querySelector('tbody'),exportButton:$('exportButton'),exportTitle:$('exportTitle'),exportHint:$('exportHint'),dialog:$('exportDialog'),dialogTotal:$('dialogTotal'),dialogValid:$('dialogValid'),dialogWarnings:$('dialogWarnings'),dialogDestinations:$('dialogDestinations'),confirmExport:$('confirmExport'),toastRegion:$('toastRegion'),liveRegion:$('liveRegion')};

  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
  function formatBytes(bytes){if(bytes===0)return'0 B';const units=['B','KB','MB'];const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),2);return`${(bytes/Math.pow(1024,i)).toFixed(i?1:0)} ${units[i]}`;}
  function extension(name){return name.toLowerCase().split('.').pop();}
  function resolveCity(value){const key=String(value??'').trim().toUpperCase().replace(/\s+/g,'');return CITIES.find(c=>c.name===key||c.code===key)||null;}
  function announce(message){els.liveRegion.textContent='';requestAnimationFrame(()=>els.liveRegion.textContent=message);}
  function toast(message,type='info'){const node=document.createElement('div');node.className=`toast ${type==='error'?'is-error':type==='success'?'is-success':type==='warning'?'is-warning':''}`;node.textContent=message;els.toastRegion.append(node);setTimeout(()=>{node.classList.add('is-leaving');setTimeout(()=>node.remove(),220);},4200);}
  function uid(){return state.nextId++;}

  function addFiles(fileList){
    const incoming=[...fileList];if(!incoming.length)return;
    incoming.forEach(file=>{
      const ext=extension(file.name);const fingerprint=`${file.name}|${file.size}|${file.lastModified}`;
      const duplicate=state.files.some(item=>item.fingerprint===fingerprint&&!item.removed);
      let status='ready',message='Ready';
      if(duplicate){status='duplicate';message='Duplicate';}
      else if(!SUPPORTED.includes(ext)){status='unsupported';message='Unsupported';}
      else if(file.size===0){status='failed';message='Failed';}
      state.files.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),file,fingerprint,status,message,error:file.size===0?'The file is empty.':'',warnings:[],processed:false});
    });
    els.fileInput.value='';renderQueue();updateActions();announce(`${incoming.length} file${incoming.length===1?'':'s'} added to the queue.`);
  }

  function queueStatusClass(status){return status==='ready'?'status-ready':status==='processing'?'status-processing':status==='completed'?'status-completed':status==='warning'?'status-warning':status==='duplicate'?'status-duplicate':status==='unsupported'?'status-unsupported':'status-failed';}
  function renderQueue(){
    els.queueCount.textContent=`${state.files.length} file${state.files.length===1?'':'s'}`;
    if(!state.files.length){els.fileQueue.innerHTML='<div class="queue-empty">No files in the queue.</div>';return;}
    els.fileQueue.innerHTML=state.files.map(item=>`<div class="file-item" data-file-id="${item.id}"><span class="file-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 12h5m-5 4h5"/></svg></span><div class="file-main"><span class="file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</span><div class="file-meta"><span>${extension(item.file.name).toUpperCase()}</span><span>${formatBytes(item.file.size)}</span>${item.error?`<span title="${escapeHtml(item.error)}">Requires attention</span>`:''}</div></div><div class="file-actions"><span class="status-chip ${queueStatusClass(item.status)}">${escapeHtml(item.message)}</span><button class="remove-file" type="button" data-remove-file="${item.id}" aria-label="Remove ${escapeHtml(item.file.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></div>`).join('');
  }

  async function processFiles(){
    const candidates=state.files.filter(item=>item.status==='ready'&&!item.processed);if(!candidates.length)return;
    els.process.disabled=true;els.removeAll.disabled=true;els.progressShell.hidden=false;
    let added=0,failed=0,warnings=0;
    for(let i=0;i<candidates.length;i++){
      const item=candidates[i];item.status='processing';item.message='Processing';renderQueue();
      const pct=Math.round((i/candidates.length)*100);els.progressValue.textContent=`${pct}%`;els.progressBar.style.width=`${pct}%`;els.progressLabel.textContent=`Processing ${item.file.name}…`;
      try{
        const result=await window.MyRepParser.parseFile(item.file);
        result.records.forEach(record=>state.records.push({...record,id:uid(),selected:false,importWarnings:[...(result.warnings||[])]}));
        added+=result.records.length;item.processed=true;item.warnings=result.warnings||[];item.status=item.warnings.length?'warning':'completed';item.message=item.warnings.length?'Completed with warnings':'Completed';warnings+=item.warnings.length;
      }catch(error){item.status='failed';item.message='Failed';item.error=error.message;failed++;toast(`${item.file.name}: ${error.message}`,'error');}
      const done=Math.round(((i+1)/candidates.length)*100);els.progressValue.textContent=`${done}%`;els.progressBar.style.width=`${done}%`;renderQueue();
    }
    els.progressLabel.textContent='Processing complete';renderRecords();updateActions();
    setTimeout(()=>{els.progressShell.hidden=true;els.progressBar.style.width='0';},700);
    const duplicateCount=state.files.filter(f=>f.status==='duplicate').length;
    const summary=`${candidates.length} file${candidates.length===1?'':'s'} processed · ${added} recipient record${added===1?'':'s'} added${duplicateCount?` · ${duplicateCount} duplicate ignored`:''}${failed?` · ${failed} failed`:''}`;
    toast(summary,failed?'warning':'success');announce(summary);
  }

  function addManualRecord(){state.records.push({id:uid(),serial:'',reference:'',name:'',phone:'',address:'',city:'BATAM',sourceFile:'Manual entry',sourceType:'Manual',selected:false,importWarnings:[]});renderRecords();updateActions();requestAnimationFrame(()=>document.querySelector(`[data-record-id="${state.records.at(-1).id}"] input[data-field="serial"]`)?.focus());toast('Manual recipient record added.','success');}
  function validateRecords(){state.records=window.MyRepValidation.validateAll(state.records,resolveCity);}
  function visibleRecords(){const q=state.query.trim().toLowerCase();return state.records.filter(r=>{const statusOk=state.filter==='all'||r.validation.status===state.filter;const hay=[r.serial,r.reference,r.name,r.phone,r.address,r.city,r.sourceFile].join(' ').toLowerCase();return statusOk&&(!q||hay.includes(q));});}
  function statusLabel(status){return status==='ready'?'Ready':status==='review'?'Needs Review':status==='incomplete'?'Incomplete':'Invalid';}
  function statusCss(status){return status==='ready'?'status-completed':status==='review'?'status-warning':status==='incomplete'?'status-unsupported':'status-failed';}
  function fieldMessage(record,key){return record.validation.fields[key]||'';}

  function renderRecords(){
    validateRecords();const visible=visibleRecords();els.recordsEmpty.hidden=state.records.length>0;els.table.hidden=state.records.length===0;els.reviewCard.classList.toggle('has-data',state.records.length>0);
    els.tbody.innerHTML=visible.map((r,index)=>{
      const city=resolveCity(r.city);const status=r.validation.status;const sourceMeta=r.sourceRow?`Row ${r.sourceRow}`:r.sourceType;
      const input=(field,type='input')=>{const msg=fieldMessage(r,field);const value=escapeHtml(r[field]);return type==='textarea'?`<textarea class="cell-textarea" data-field="${field}" aria-label="${field} for record ${index+1}" aria-invalid="${msg?'true':'false'}">${value}</textarea>${msg?`<span class="field-message">${escapeHtml(msg)}</span>`:''}`:`<input class="cell-input" data-field="${field}" type="text" value="${value}" aria-label="${field} for record ${index+1}" aria-invalid="${msg?'true':'false'}">${msg?`<span class="field-message">${escapeHtml(msg)}</span>`:''}`;};
      return`<tr data-record-id="${r.id}"><td data-label="Select"><input type="checkbox" data-select-record="${r.id}" aria-label="Select record ${index+1}" ${r.selected?'checked':''}></td><td data-label="Record"><span class="record-number">${state.records.indexOf(r)+1}</span></td><td data-label="Status"><div class="record-status"><span class="status-chip ${statusCss(status)}">${statusLabel(status)}</span><span class="issue-count">${r.validation.issueCount?`${r.validation.issueCount} issue${r.validation.issueCount===1?'':'s'}`:'No issues'}</span></div></td><td data-label="Source"><span class="record-source" title="${escapeHtml(r.sourceFile)}">${escapeHtml(r.sourceFile)}<small>${escapeHtml(sourceMeta||'')}</small></span></td><td data-label="Serial Number">${input('serial')}</td><td data-label="Shipping Reference / DO Number">${input('reference')}</td><td data-label="Recipient Name">${input('name')}</td><td data-label="Phone">${input('phone')}</td><td data-label="Address">${input('address','textarea')}</td><td data-label="Destination City"><input class="cell-input" data-field="city" type="search" list="cityOptions" value="${escapeHtml(r.city)}" aria-label="Destination city for record ${index+1}" aria-invalid="${fieldMessage(r,'city')?'true':'false'}" placeholder="Search city or postcode">${fieldMessage(r,'city')?`<span class="field-message">${escapeHtml(fieldMessage(r,'city'))}</span>`:''}</td><td data-label="Postcode"><span class="postcode-output">${city?window.MyRepExport.postcodeFromZone(city.code):'—'}</span></td><td data-label="Actions"><button class="row-delete" type="button" data-delete-record="${r.id}" aria-label="Delete record ${index+1}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6"/></svg></button></td></tr>`;
    }).join('');
    renderSummary();renderPreview();updateActions();
  }

  function renderSummary(){
    const counts={ready:0,review:0,incomplete:0,invalid:0};state.records.forEach(r=>counts[r.validation.status]++);els.total.textContent=state.records.length;els.ready.textContent=counts.ready;els.review.textContent=counts.review;els.invalid.textContent=counts.invalid+counts.incomplete;
    els.workspaceStatus.className='workspace-status';
    if(!state.records.length){els.workspaceStatus.innerHTML='<span class="status-dot"></span>No recipient records yet';}
    else if(counts.invalid||counts.incomplete){els.workspaceStatus.classList.add('is-invalid');els.workspaceStatus.innerHTML=`<span class="status-dot"></span>${counts.invalid+counts.incomplete} record${counts.invalid+counts.incomplete===1?'':'s'} must be fixed`;}
    else if(counts.review){els.workspaceStatus.classList.add('is-warning');els.workspaceStatus.innerHTML=`<span class="status-dot"></span>${counts.review} record${counts.review===1?'':'s'} can export with warnings`;}
    else{els.workspaceStatus.classList.add('is-ready');els.workspaceStatus.innerHTML='<span class="status-dot"></span>All records are ready';}
    updateWorkflow(counts);
  }

  function renderPreview(){
    if(!state.records.length){els.previewBody.innerHTML='<tr><td colspan="8">Add recipient records to view export details.</td></tr>';return;}
    const rows=window.MyRepExport.buildExportRows(state.records,resolveCity);
    els.previewBody.innerHTML=rows.map((row,index)=>`<tr><td>${index+1}</td><td>${escapeHtml(row.destination_data_customer_name)}</td><td>${escapeHtml(row.destination_data_customer_phone)}</td><td title="${escapeHtml(row.destination_data_customer_address)}">${escapeHtml(row.destination_data_customer_address)}</td><td>${row.destination_data_customer_zip_code}</td><td>${row.destination_data_zone_code}</td><td>${escapeHtml(row.ref_no)}</td><td>${escapeHtml(state.records[index].serial)}</td></tr>`).join('');
  }

  function updateWorkflow(counts){let stage=1;if(state.records.length)stage=2;if(state.records.length&&(counts?.invalid||counts?.incomplete||counts?.review||counts?.ready))stage=3;if(state.records.length&&!counts.invalid&&!counts.incomplete)stage=4;document.querySelectorAll('.workflow-step').forEach(step=>{const n=Number(step.dataset.step);step.classList.toggle('is-active',n===stage);step.classList.toggle('is-complete',n<stage);});}
  function updateActions(){
    const pending=state.files.some(f=>f.status==='ready'&&!f.processed);els.process.disabled=!pending;els.removeAll.disabled=!state.files.length;els.clear.disabled=!state.files.length&&!state.records.length;
    const selected=state.records.some(r=>r.selected);els.deleteSelected.disabled=!selected;const critical=state.records.some(r=>['invalid','incomplete'].includes(r.validation?.status));els.exportButton.disabled=!state.records.length||critical;
    if(!state.records.length){els.exportTitle.textContent='Add and validate recipient records before exporting.';els.exportHint.textContent='Critical validation errors must be resolved first.';}
    else if(critical){els.exportTitle.textContent='Resolve critical validation errors before exporting.';els.exportHint.textContent='Review highlighted fields and duplicate values.';}
    else{const warningCount=state.records.filter(r=>r.validation.status==='review').length;els.exportTitle.textContent=`${state.records.length} record${state.records.length===1?' is':'s are'} ready for workbook export.`;els.exportHint.textContent=warningCount?`${warningCount} record${warningCount===1?' has':'s have'} non-blocking warnings.`:'All required fields passed validation.';}
  }
  function removeFile(id){state.files=state.files.filter(f=>f.id!==id);renderQueue();updateActions();}
  function deleteRecord(id){state.records=state.records.filter(r=>r.id!==Number(id));renderRecords();}
  function clearWorkspace(){state.files=[];state.records=[];state.nextId=1;state.query='';state.filter='all';els.search.value='';els.filter.value='all';renderQueue();renderRecords();toast('Workspace cleared.','success');announce('Workspace cleared.');}
  function selectedDestinations(){const counts=new Map();state.records.forEach(r=>{const city=resolveCity(r.city);if(city)counts.set(city.name,(counts.get(city.name)||0)+1);});return[...counts].map(([name,count])=>`${name} (${count})`).join(', ')||'—';}
  function openExportDialog(){const valid=state.records.filter(r=>r.validation.status==='ready').length;const warnings=state.records.filter(r=>r.validation.status==='review').length;els.dialogTotal.textContent=state.records.length;els.dialogValid.textContent=valid;els.dialogWarnings.textContent=warnings;els.dialogDestinations.textContent=selectedDestinations();els.dialog.showModal();}
  function performExport(){try{els.confirmExport.disabled=true;els.confirmExport.textContent='Preparing workbook…';window.MyRepExport.downloadWorkbook(state.records,resolveCity);toast('Workbook downloaded successfully.','success');els.dialog.close();}catch(error){toast(error.message,'error');}finally{els.confirmExport.disabled=false;els.confirmExport.textContent='Download Workbook';}}

  els.dropzone.addEventListener('click',()=>els.fileInput.click());els.fileInput.addEventListener('change',e=>addFiles(e.target.files));
  ['dragenter','dragover'].forEach(type=>els.dropzone.addEventListener(type,e=>{e.preventDefault();els.dropzone.classList.add('dragover');}));['dragleave','drop'].forEach(type=>els.dropzone.addEventListener(type,e=>{e.preventDefault();els.dropzone.classList.remove('dragover');}));els.dropzone.addEventListener('drop',e=>addFiles(e.dataTransfer.files));
  els.fileQueue.addEventListener('click',e=>{const btn=e.target.closest('[data-remove-file]');if(btn)removeFile(btn.dataset.removeFile);});els.removeAll.addEventListener('click',()=>{state.files=[];renderQueue();updateActions();});els.process.addEventListener('click',processFiles);els.addManual.addEventListener('click',addManualRecord);els.clear.addEventListener('click',clearWorkspace);
  els.search.addEventListener('input',e=>{state.query=e.target.value;renderRecords();});els.filter.addEventListener('change',e=>{state.filter=e.target.value;renderRecords();});
  els.tbody.addEventListener('input',e=>{const field=e.target.dataset.field;if(!field)return;const row=e.target.closest('[data-record-id]');const record=state.records.find(r=>r.id===Number(row.dataset.recordId));if(record)record[field]=e.target.value;});
  els.tbody.addEventListener('change',e=>{
    const field=e.target.dataset.field;
    if(field){const row=e.target.closest('[data-record-id]');const record=state.records.find(r=>r.id===Number(row.dataset.recordId));if(record)record[field]=e.target.value;renderRecords();return;}
    if(e.target.matches('[data-select-record]')){const r=state.records.find(x=>x.id===Number(e.target.dataset.selectRecord));if(r)r.selected=e.target.checked;updateActions();}
  });
  els.tbody.addEventListener('click',e=>{const btn=e.target.closest('[data-delete-record]');if(btn)deleteRecord(btn.dataset.deleteRecord);});
  els.selectAll.addEventListener('change',e=>{visibleRecords().forEach(r=>r.selected=e.target.checked);renderRecords();});els.deleteSelected.addEventListener('click',()=>{state.records=state.records.filter(r=>!r.selected);renderRecords();toast('Selected records deleted.','success');});
  els.exportButton.addEventListener('click',openExportDialog);els.confirmExport.addEventListener('click',performExport);

  window.__MYREP_TEST__={state,resolveCity,addManualRecord,validateRecords,renderRecords,processFiles,clearWorkspace,openExportDialog};
  renderQueue();renderRecords();
})();
