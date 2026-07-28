(function(global){
  'use strict';

  const ALIASES={
    serial:['s/n','sn','serial number','serial','serial no','imei'],
    reference:['ref no','ref_no','reference','reference no','no do','do number','shipping reference'],
    name:['nama penerima','penerima','recipient name','name','nama'],
    phone:['no hp','phone','recipient phone','nomor hp','hp','telephone','telp'],
    address:['alamat','address','recipient address','alamat penerima'],
    city:['kota','city','destination city','kota tujuan']
  };

  function normalizeHeader(value){
    return String(value??'').trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
  }

  function findColumnIndex(headers,aliases){
    const normalized=headers.map(normalizeHeader);
    for(const alias of aliases){
      const idx=normalized.indexOf(normalizeHeader(alias));
      if(idx!==-1)return idx;
    }
    return -1;
  }

  function parseCSV(text){
    const rows=[];let row=[];let cell='';let quoted=false;
    const source=String(text??'').replace(/^\uFEFF/,'');
    for(let i=0;i<source.length;i++){
      const ch=source[i];
      if(quoted){
        if(ch==='"'&&source[i+1]==='"'){cell+='"';i++;}
        else if(ch==='"'){quoted=false;}
        else cell+=ch;
      }else if(ch==='"'){quoted=true;}
      else if(ch===','){row.push(cell);cell='';}
      else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
      else cell+=ch;
    }
    if(cell.length||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}
    return rows;
  }

  function rowsToRecords(rows,sourceFile){
    if(!Array.isArray(rows)||rows.length===0)throw new Error('This spreadsheet is empty.');
    const headers=(rows[0]||[]).map(v=>String(v??'').trim());
    const indexes={};
    Object.entries(ALIASES).forEach(([key,aliases])=>{indexes[key]=findColumnIndex(headers,aliases);});
    const recognized=Object.values(indexes).filter(i=>i>=0).length;
    if(recognized<2||indexes.name<0||indexes.address<0){
      throw new Error('This spreadsheet does not contain recognized recipient columns.');
    }
    const records=[];const warnings=[];
    rows.slice(1).forEach((row,rowIndex)=>{
      const values=Array.isArray(row)?row:[];
      if(values.every(v=>String(v??'').trim()===''))return;
      const record={
        serial:indexes.serial>=0?String(values[indexes.serial]??'').trim():'',
        reference:indexes.reference>=0?String(values[indexes.reference]??'').trim():'',
        name:indexes.name>=0?String(values[indexes.name]??'').trim():'',
        phone:indexes.phone>=0?String(values[indexes.phone]??'').trim():'',
        address:indexes.address>=0?String(values[indexes.address]??'').trim():'',
        city:indexes.city>=0?String(values[indexes.city]??'BATAM').trim()||'BATAM':'BATAM',
        sourceFile,sourceType:'Spreadsheet',sourceRow:rowIndex+2
      };
      if(!record.name&&!record.address&&!record.reference&&!record.serial){
        warnings.push(`Row ${rowIndex+2} was ignored because it did not contain usable recipient data.`);
        return;
      }
      records.push(record);
    });
    if(records.length===0)throw new Error('We could not find recipient records in this file.');
    return{records,warnings};
  }

  function parseBASTDocument(doc,sourceFile){
    const warnings=[];
    let name='',phone='',address='',reference='';
    const topDiv=doc.querySelector('table.t02 tr td div');
    if(topDiv){
      const html=topDiv.innerHTML;
      const lines=html.split(/<br\s*\/?\s*>/i).map(line=>{
        const temp=doc.createElement('div');temp.innerHTML=line;return(temp.textContent||'').trim();
      }).filter(Boolean);
      name=lines[0]||'';phone=lines[1]||'';address=lines.slice(2).join(' ').trim();
    }
    if(!name)warnings.push('Recipient name not found');
    if(!phone)warnings.push('Phone number not found');
    if(!address)warnings.push('Recipient address not found');

    const tds=[...doc.querySelectorAll('#t03 td')];
    for(let i=0;i<tds.length;i++){
      if(/no\.?\s*do/i.test(tds[i].textContent||'')){
        reference=(tds[i+1]?.textContent||'').replace(/^\s*:\s*/,'').trim();break;
      }
    }
    if(!reference){
      const match=(doc.body?.innerText||'').match(/No\.?\s*DO\s*:?\s*([A-Z0-9\/_-]+)/i);
      reference=match?.[1]?.trim()||'';
    }
    if(!reference)warnings.push('DO number not found');

    const serials=[];
    [...doc.querySelectorAll('#t04 tr')].slice(2).forEach(row=>{
      const cells=row.querySelectorAll('td');
      const value=(cells[4]?.textContent||'').trim();
      if(value)serials.push(value);
    });
    if(serials.length===0)warnings.push('Serial number not found');

    if(!name&&!phone&&!address&&!reference&&serials.length===0){
      throw new Error('The BAST structure could not be recognized.');
    }
    return{records:[{serial:serials.join(', '),reference,name,phone,address,city:'BATAM',sourceFile,sourceType:'BAST HTML'}],warnings};
  }

  async function parseBASTFile(file){
    const text=await file.text();
    if(!text.trim())throw new Error('This HTML file is empty.');
    const doc=new DOMParser().parseFromString(text,'text/html');
    return parseBASTDocument(doc,file.name);
  }

  async function parseSpreadsheetFile(file){
    const extension=file.name.toLowerCase().split('.').pop();
    if(extension==='csv'){
      const text=await file.text();
      if(!text.trim())throw new Error('This CSV file is empty.');
      return rowsToRecords(parseCSV(text),file.name);
    }
    if(!global.XLSX)throw new Error('The Excel processing library could not be loaded. Check your network connection and try again.');
    const data=await file.arrayBuffer();
    let workbook;
    try{workbook=global.XLSX.read(data,{type:'array',cellDates:false});}
    catch(error){throw new Error('This Excel file is corrupt or could not be read.');}
    const firstSheet=workbook.SheetNames?.[0];
    if(!firstSheet)throw new Error('This workbook does not contain a worksheet.');
    const sheet=workbook.Sheets[firstSheet];
    const rows=global.XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,blankrows:false});
    return rowsToRecords(rows,file.name);
  }

  async function parseFile(file){
    const ext=file.name.toLowerCase().split('.').pop();
    if(['html','htm'].includes(ext))return parseBASTFile(file);
    if(['xlsx','xls','csv'].includes(ext))return parseSpreadsheetFile(file);
    throw new Error('Unsupported file format. Use HTML, HTM, XLSX, XLS, or CSV.');
  }

  global.MyRepParser={ALIASES,normalizeHeader,parseCSV,rowsToRecords,parseBASTDocument,parseBASTFile,parseSpreadsheetFile,parseFile};
})(window);
