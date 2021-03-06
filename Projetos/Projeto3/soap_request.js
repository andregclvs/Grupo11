const axios = require('axios-https-proxy-fix');
const { sha256 } = require('js-sha256');
var path=require('path');
var lib=path.join(path.dirname(require.resolve('axios')),'lib/adapters/http');
var http=require(lib);
/**
 * @param {object} opts easy-soap-request options
 * @param {string} opts.url endpoint URL
 * @param {object} opts.headers  HTTP headers, can be string or object
 * @param {string} opts.xml SOAP envelope, can be read from file or passed as string
 * @param {int} opts.timeout Milliseconds before timing out request
 * @param {object} opts.proxy Object with proxy configuration
 * @promise response
 * @reject {error}
 * @fulfill {body,statusCode}
 * @returns {Promise.response{body,statusCode}}

*/
function soapRequest(opts = {
  url: '',
  headers: {},
  xml: '',
  timeout: 10000,
  proxy: false,
}) {
  const {
    url,
    headers,
    xml,
    timeout,
    proxy,
  } = opts;
  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url,
      adapter: http,
      headers,
      data: xml,
      timeout,
      proxy,
    }).then((response) => {
      resolve({
        response: {
          headers: response.headers,
          body: response.data,
          statusCode: response.status,
        },
      });
    }).catch((error) => {
      if (error.response) {
        console.log(`SOAP FAIL: ${error}`);
        reject(error.response.data);
      } else {
        console.log(`SOAP FAIL: ${error}`);
        reject(error);
      }
    });
  });
};


// *------------------------------------------------ getCertificate ------------------------------------------------* //
/** 
* @param {String} user_id número de telemóvel do utilizador
* @param {String} application_id id da aplicação
* @returns {String} xml com o pedido  
*/
function getCertificateXML(user_id, application_id) {
    xml = '<soap-env:Envelope xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/">' + 
    '<soap-env:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">' +
       '<wsa:Action>http://Ama.Authentication.Service/CCMovelSignature/GetCertificate</wsa:Action>' +
       '<wsa:MessageID>urn:uuid:66edc9ce-8b57-432c-8b32-37454755566a</wsa:MessageID>' + 
       '<wsa:To>https://preprod.cmd.autenticacao.gov.pt/Ama.Authentication.Frontend/CCMovelDigitalSignature.svc</wsa:To>' +
    '</soap-env:Header>' +
    '<soap-env:Body>' + 
       '<ns0:GetCertificate xmlns:ns0="http://Ama.Authentication.Service/">' + 
          '<ns0:applicationId>' + String(application_id) + '</ns0:applicationId>' + 
          '<ns0:userId>' + String(user_id) + '</ns0:userId>'+
       '</ns0:GetCertificate>' + 
    '</soap-env:Body>' + 
 '</soap-env:Envelope>';
    return xml;
};

/** 
* @param {String} user_id número de telemóvel do utilizador
* @param {String} application_id id da aplicação
* @returns {Object} response com a resposta ao pedido  
*/
async function getCertificateRequest(user_id, application_id, url) {
    console.log("Aquiii" + url)
    const xml = getCertificateXML(user_id, application_id);
    const sampleHeaders = {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: 'http://Ama.Authentication.Service/CCMovelSignature/GetCertificate',
    };
    //console.log(xml)
    const { response } = await soapRequest({ url: url, headers: sampleHeaders, xml: xml, timeout: 1000 });
    const { headers, body, statusCode } = response;
    //console.log(statusCode);
    //console.log(headers);
    return response;
};
// *------------------------------------------------ getCertificate ------------------------------------------------* //

// *------------------------------------------------ CCMovelSignature ----------------------------------------------* //
/** 
* @param {String} user_id número de telemóvel do utilizador
* @param {String} application_id id da aplicação
* @param {String} docname nome do documento a ser assinado
* @param {String} hash tipo de hash
* @param {String} cmd_pin pin da chave móvel digital
* @returns {String} xml com o pedido  
*/
function getCCMovelSignXML(user_id,application_id, docname, hash,cmd_pin) {   
   xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ama="http://Ama.Authentication.Service/" xmlns:ama1="http://schemas.datacontract.org/2004/07/Ama.Structures.CCMovelSignature">' + 
    '<soapenv:Header/>' + 
    '<soapenv:Body>' + 
       '<ama:CCMovelSign>' + 
          '<!--Optional:-->' + 
          '<ama:request>' + 
             '<ama1:ApplicationId>' + String(application_id) + '</ama1:ApplicationId>' + 
             
             '<ama1:DocName>' + String(docname) + '</ama1:DocName>' + 
             '<ama1:Hash>' + String(hash) + '</ama1:Hash>' + 
             '<ama1:Pin>' + String(cmd_pin) + '</ama1:Pin>' + 
             '<ama1:UserId>' + String(user_id) + '</ama1:UserId>' +
          '</ama:request>' + 
       '</ama:CCMovelSign>' + 
    '</soapenv:Body>' + 
 '</soapenv:Envelope>';
    return xml;
}

/** 
* @param {String} user_id número de telemóvel do utilizador
* @param {String} application_id id da aplicação
* @param {String} docname nome do documento a ser assinado
* @param {String} hash tipo de hash
* @param {String} cmd_pin pin da chave móvel digital
* @returns {String} response com o documento assinado   
*/
async function CCMovelSignRequest(user_id,application_id, docname, hash,cmd_pin, url) {
    const xml = getCCMovelSignXML(user_id,application_id, docname, hash,cmd_pin);
    
    const sampleHeaders = {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: 'http://Ama.Authentication.Service/CCMovelSignature/CCMovelSign',
    };
    
    const { response } = await soapRequest({ url: url, headers: sampleHeaders, xml: xml, timeout: 1000 });
    const { headers, body, statusCode } = response;
    //console.log(headers);
    //console.log(body);
    //console.log(statusCode);
    pre_message = body.substring(body.search('<a:Message>') + 11)
    response.message = pre_message.substring(0, pre_message.search('<'))
    return response;
};
// *------------------------------------------------ CCMovelSignature -----------------------------------------------* //

// *------------------------------------------------ CCMovelMultSignature -------------------------------------------* //
/** 
* @param {String} hash hash 
* @param {String} name id da aplicação
* @param {String} id nome do documento a ser assinado
* @returns {String} xml com o pedido  
*/
function getMultSignHashStructures(name, index) {
    xml = '<ama1:HashStructure>' + 
            '<ama1:Hash>' + sha256(name) + '</ama1:Hash>' + 
            '<ama1:Name>' + String(name) + '</ama1:Name>' + 
            '<ama1:id>' + String(index) + '</ama1:id>' +
        '</ama1:HashStructure>'
    
        return xml
}

/** 
* @param {String} user_id número de telemóvel do utilizador
* @param {String} application_id id da aplicação
* @param {String} docname nome do documento a ser assinado
* @param {String} hash tipo de hash
* @param {String} cmd_pin pin da chave móvel digital
* @param {Array} pre_struct array com objetos compostos por hash, name e id
* @returns {String} xml com o pedido  
*/
function getCCMovelMultSignXML(user_id, application_id, docnames, cmd_pin) {
    let hash_struct = ''
    docnames.forEach((element,index) => {
        hash_struct += getMultSignHashStructures(element,index)
    });
    
      xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ama="http://Ama.Authentication.Service/" xmlns:ama1="http://schemas.datacontract.org/2004/07/Ama.Structures.CCMovelSignature">' + 
      '<soapenv:Header/>' + 
      '<soapenv:Body>' + 
         '<ama:CCMovelMultipleSign>' + 
            '<!--Optional:-->' +
            '<ama:request>' + 
               '<ama1:ApplicationId>' + String(application_id) + '</ama1:ApplicationId>' + 
               '<ama1:Pin>' + String(cmd_pin) + '</ama1:Pin>' + 
               '<ama1:UserId>' + String(user_id) + '</ama1:UserId>' +
            '</ama:request>' + 
            '<!--Optional:-->' + 
            '<ama:documents>' + 
               '<!--Zero or more repetitions:-->' + 
                  hash_struct + 
            '</ama:documents>' + 
         '</ama:CCMovelMultipleSign>' + 
      '</soapenv:Body>' + 
   '</soapenv:Envelope>'
    return xml;
}

/** 
* @param {String} user_id número de telemóvel do utilizador
* @param {String} application_id id da aplicação
* @param {String} docname nome do documento a ser assinado
* @param {String} hash tipo de hash
* @param {String} cmd_pin pin da chave móvel digital
* @returns {String} response com o documento assinado   
*/
async function CCMovelMultSignRequest(user_id,application_id, docnames, cmd_pin, url) {
    const xml = getCCMovelMultSignXML(user_id,application_id, docnames, cmd_pin);
    console.log("Aquiii" + url)
    const sampleHeaders = {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: 'http://Ama.Authentication.Service/CCMovelSignature/CCMovelMultipleSign',
    };

    const { response } = await soapRequest({ url: url, headers: sampleHeaders, xml: xml, timeout: 1000 });
    const { headers, body, statusCode } = response;
    
    //console.log(headers);
    //console.log(response)
    //console.log(body);
    //console.log(statusCode);
    pre_message = body.substring(body.search('<a:Message>') + 11)
    response.message = pre_message.substring(0, pre_message.search('<'))
    return response;
};

// *------------------------------------------------ CCMovelMultSignature -------------------------------------------* //

// *------------------------------------------------ ValidateOTP ----------------------------------------------------* //
/** 
* @param {String} ama_code código do ama
* @param {String} process_id id do processo
* @param {String} application_id id da aplicação
* @returns {String} xml com o pedido  
*/
function getValidateOTPXML(ama_code,process_id, application_id) {
    xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ama="http://Ama.Authentication.Service/">' + 
    '<soapenv:Header/>' + 
    '<soapenv:Body>' + 
       '<ama:ValidateOtp>' + 
          '<!--Optional:-->' + 
          '<ama:code>' + String(ama_code) + '</ama:code>' + 
          '<!--Optional:-->' + 
          '<ama:processId>' + String(process_id) + '</ama:processId>' +
          '<!--Optional:-->' + 
          '<ama:applicationId>' + String(application_id) + '</ama:applicationId>' + 
       '</ama:ValidateOtp>' + 
    '</soapenv:Body>' +
 '</soapenv:Envelope>';
    return xml;
}

/** 
* @param {String} ama_code código do ama
* @param {String} process_id id do processo
* @param {String} application_id id da aplicação
* @returns {String} response com o documento assinado   
*/

async function validateOTPRequest(ama_code, process_id, application_id, url) {
    const xml = getValidateOTPXML(ama_code, process_id, application_id);
   
    const sampleHeaders = {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: 'http://Ama.Authentication.Service/CCMovelSignature/ValidateOtp',
    };
    console.log(xml)
    const { response } = await soapRequest({ url: url, headers: sampleHeaders, xml: xml, timeout: 1000 });
    const { headers, body, statusCode } = response;
    //console.log(headers);
    //console.log(body);
    //console.log(statusCode);
    pre_message = body.substring(body.search('<a:Message>') + 11)
    response.message = pre_message.substring(0, pre_message.search('<'))
    return response;
};
// *------------------------------------------------ ValidateOTP ----------------------------------------------------* //

module.exports.getCertificateRequest= getCertificateRequest
module.exports.CCMovelSignRequest= CCMovelSignRequest
module.exports.CCMovelMultSignRequest = CCMovelMultSignRequest
module.exports.validateOTPRequest = validateOTPRequest

