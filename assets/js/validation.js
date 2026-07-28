(function(global){
  'use strict';
  function normalizePlain(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim().replace(/\s+/g,' ');}
  function sanitizeGeneral(value){return normalizePlain(value).replace(/[^A-Z0-9\s]/g,'').replace(/\s+/g,' ').trim();}
  function sanitizeAddress(value){return normalizePlain(value).replace(/[^A-Z0-9\s.,/()#-]/g,'').replace(/\s+/g,' ').trim();}
  function sanitizePhone(value){return String(value??'').replace(/\D/g,'');}
  function serialTokens(value){return sanitizeGeneral(value).split(/\s*,\s*|\s+/).filter(Boolean);}
  function hasUnsupported(value,field){
    const raw=normalizePlain(value);
    const allowed=field==='address'?/^[A-Z0-9\s.,/()#-]*$/:/^[A-Z0-9\s]*$/;
    return raw!==''&&!allowed.test(raw);
  }
  function validateAll(records,cityResolver){
    const serialMap=new Map(),refMap=new Map();
    records.forEach(r=>{
      serialTokens(r.serial).forEach(s=>serialMap.set(s,(serialMap.get(s)||0)+1));
      const ref=sanitizeGeneral(r.reference);if(ref)refMap.set(ref,(refMap.get(ref)||0)+1);
    });
    return records.map(record=>{
      const fields={};const warnings=[];const errors=[];
      const required={serial:'Serial number is required.',reference:'Shipping reference / DO number is required.',name:'Recipient name is required.',phone:'Recipient phone is required.',address:'Recipient address is required.',city:'Destination city is required.'};
      Object.entries(required).forEach(([key,message])=>{if(!String(record[key]??'').trim()){fields[key]=message;errors.push(message);}});
      const phone=sanitizePhone(record.phone);
      if(record.phone&&phone.length<8){fields.phone='Phone number is unusually short.';errors.push(fields.phone);}
      if(record.phone&&phone.length>15){fields.phone='Phone number is too long.';errors.push(fields.phone);}
      if(record.address&&sanitizeAddress(record.address).length<8){warnings.push('Recipient address is unusually short.');fields.address=fields.address||'Address may be too short.';}
      ['serial','reference','name','address'].forEach(key=>{if(record[key]&&hasUnsupported(record[key],key)){warnings.push(`${key[0].toUpperCase()+key.slice(1)} contains characters that will be normalized during export.`);}});
      const city=cityResolver(record.city);
      if(record.city&&!city){fields.city='Select a supported destination city.';errors.push(fields.city);}
      const duplicateSerial=serialTokens(record.serial).some(s=>(serialMap.get(s)||0)>1);
      if(duplicateSerial){fields.serial='Duplicate serial number detected.';errors.push(fields.serial);}
      const ref=sanitizeGeneral(record.reference);
      if(ref&&(refMap.get(ref)||0)>1){fields.reference='Duplicate reference number detected.';errors.push(fields.reference);}
      if(record.importWarnings?.length)warnings.push(...record.importWarnings);
      let status='ready';
      const missing=Object.keys(required).some(key=>!String(record[key]??'').trim());
      if(missing)status='incomplete';else if(errors.length)status='invalid';else if(warnings.length)status='review';
      return{...record,validation:{status,fields,warnings,errors,issueCount:new Set([...errors,...warnings]).size}};
    });
  }
  global.MyRepValidation={normalizePlain,sanitizeGeneral,sanitizeAddress,sanitizePhone,serialTokens,validateAll};
})(window);
