(function(global){
  'use strict';
  const HEADERS=["connote_code","customer_code","origin_data_customer_name","origin_data_customer_phone","origin_data_customer_address","origin_data_customer_zip_code","origin_data_zone_code","destination_data_customer_name","destination_data_customer_phone","destination_data_customer_address","destination_data_customer_zip_code","destination_data_zone_code","service_code","connote_sub_service_code","koli_data_koli_description","koli_data_koli_weight","koli_data_koli_width","koli_data_koli_height","koli_data_koli_length","transaction_payment_type_name","instruksi_pengiriman","harga_barang","ref_no","Jenis_Barang","statusRetur","INS"];
  const FILE_NAME='MyRepublic_Pos_Batam_Batch.xlsx';
  const SHEET_NAME='Sheet1';
  const CONSTANTS={customer_code:'WSREPUBLIC02130B',origin_data_customer_name:'WH KCU BATAM',origin_data_customer_phone:'0778462033',origin_data_customer_zip_code:29411,origin_data_zone_code:29400,service_code:'PKH',connote_sub_service_code:913926,koli_data_koli_weight:1,koli_data_koli_width:16,koli_data_koli_height:6,koli_data_koli_length:30,transaction_payment_type_name:'INVOICE',instruksi_pengiriman:'Tolong diantar dengan baik',harga_barang:0,Jenis_Barang:'Paket',statusRetur:'Kembali ke pengirim'};
  function postcodeFromZone(zone){const value=String(zone??'').trim();return value.endsWith('00')?value.slice(0,-2)+'11':value;}
  function buildExportRows(records,cityResolver){
    return records.map((record,index)=>{
      const city=cityResolver(record.city)||{};
      const serial=global.MyRepValidation.sanitizeGeneral(record.serial);
      const reference=global.MyRepValidation.sanitizeGeneral(record.reference);
      return{
        connote_code:index+1,customer_code:CONSTANTS.customer_code,origin_data_customer_name:CONSTANTS.origin_data_customer_name,origin_data_customer_phone:CONSTANTS.origin_data_customer_phone,
        origin_data_customer_address:`${serial} BATAM`.trim(),origin_data_customer_zip_code:CONSTANTS.origin_data_customer_zip_code,origin_data_zone_code:CONSTANTS.origin_data_zone_code,
        destination_data_customer_name:global.MyRepValidation.sanitizeGeneral(record.name),destination_data_customer_phone:global.MyRepValidation.sanitizePhone(record.phone),destination_data_customer_address:global.MyRepValidation.sanitizeAddress(record.address),
        destination_data_customer_zip_code:Number(postcodeFromZone(city.code)),destination_data_zone_code:Number(city.code),service_code:CONSTANTS.service_code,connote_sub_service_code:CONSTANTS.connote_sub_service_code,
        koli_data_koli_description:reference,koli_data_koli_weight:CONSTANTS.koli_data_koli_weight,koli_data_koli_width:CONSTANTS.koli_data_koli_width,koli_data_koli_height:CONSTANTS.koli_data_koli_height,koli_data_koli_length:CONSTANTS.koli_data_koli_length,
        transaction_payment_type_name:CONSTANTS.transaction_payment_type_name,instruksi_pengiriman:CONSTANTS.instruksi_pengiriman,harga_barang:CONSTANTS.harga_barang,ref_no:reference,Jenis_Barang:CONSTANTS.Jenis_Barang,statusRetur:CONSTANTS.statusRetur,INS:''
      };
    });
  }
  function createWorkbook(records,cityResolver){
    if(!global.XLSX)throw new Error('The Excel export library could not be loaded. Check your network connection and try again.');
    const rows=buildExportRows(records,cityResolver);
    const worksheet=global.XLSX.utils.json_to_sheet(rows,{header:HEADERS});
    worksheet['!cols']=HEADERS.map(key=>({wch:key.includes('address')?42:key.includes('name')?28:24}));
    const workbook=global.XLSX.utils.book_new();
    global.XLSX.utils.book_append_sheet(workbook,worksheet,SHEET_NAME);
    return{workbook,rows};
  }
  function downloadWorkbook(records,cityResolver){const {workbook}=createWorkbook(records,cityResolver);global.XLSX.writeFile(workbook,FILE_NAME,{compression:true});}
  global.MyRepExport={HEADERS,FILE_NAME,SHEET_NAME,CONSTANTS,postcodeFromZone,buildExportRows,createWorkbook,downloadWorkbook};
})(window);
