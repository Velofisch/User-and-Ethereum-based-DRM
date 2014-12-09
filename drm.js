// First steps towards a simple asset registration and management system
// Geneva Hackathon CUI 11-26-2014 Jörn Erbguth joern@erbguth.net


//change this contract address to the one you have created!
var contractAddress = '0x5ca51e1eaad50081e37fc81b27c7639386fe6233';

//common definitions
// Index by the hashcode of the work
var OFFSET_WORK = 1;
var OFFSET_TIMESTAMP = 2;
var OFFSET_CONTRACT = 3;
var OFFSET_PREVIOUS_WORK = 4;

// per creator
var OFFSET_CREATORS = 5;

var OFFSET_WORKCOUNT=0;

var web3=require('web3');



function addOffset(address, offset) {
  var newaddress=(String)(address);
  if(newaddress.substring(0,2)=="0x") newaddress=newaddress.substring(2,42);
  else newaddress=newaddress.substring(0,40);
  if(newaddress.length < 40) newaddress="000000000000000000000000000000000000000".substring(0,40-newaddress.length)+newaddress;
  newaddress=offset+newaddress;
  if(newaddress.length < 64) newaddress="000000000000000000000000000000000000000".substring(0,64-newaddress.length)+newaddress;
  newaddress="0x"+newaddress;
  return(newaddress);
}


function handleFileSelect(evt) {
    handleFileInput(evt.target);
  }

  function handleFileInput(inputField) {
    var files = inputField.files; // FileList object
    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
      handleFile(f);
    }
  }{}


  function handleFile(f)
  {
      var entry = document.createElement('entry');
      document.getElementById('list').insertBefore(entry, null);
      var cell=document.createElement("register");
      var button=document.createElement("input");
      button.setAttribute('type','button');
      button.setAttribute('value','register');
      button.setAttribute('disabled','disabled');
      cell.appendChild(button);
      entry.appendChild(cell);
      addTextElement(entry,'filename',f.name);
      entry.setAttribute('filename',f.name);
      addTextElement(entry,'size',f.size);
      entry.setAttribute('size',f.size);
      addTextElement(entry,'date',f.lastModifiedDate);
      entry.setAttribute('date',f.lastModifiedDate);
      addTextElement(entry,'type',f.type);
      entry.setAttribute('type',f.type)
      
      if (f.type.match('image.*')) {

        var urlReader = new FileReader();

        // Closure to capture the file information.
        urlReader.onload = (function(theEntry) {
          return function(e) {
            // Render thumbnail.
            var imgTag=document.createElement("img");
            imgTag.setAttribute("src",e.target.result);
            imgTag.setAttribute("title",escape(theEntry.name));
            imgTag.setAttribute("height","60");
            var imgCell=document.createElement("cell");
            imgCell.appendChild(imgTag)
            theEntry.appendChild(imgCell)
          };
        })(entry);
         // Read in the image file as a data URL.
        urlReader.readAsDataURL(f);
      }
      else entry.appendChild(document.createElement("noimage"));

      // If we use onloadend, we need to check the readyState.
      var hashReader = new FileReader();
      hashReader.onloadend = (function(theEntry) {
        return function(e) {
          if (e.target.readyState == FileReader.DONE) { // DONE == 2
            var hashstring=String(CryptoJS.SHA3(e.target.result));
            // only 40 Byte hash
            hashstring='0x'+hashstring.substring(0,40);
            theEntry.setAttribute("name",hashstring);
            addTextElement(theEntry,'hash',hashstring.substring(0,10)+'...');
            // test if already registered
            checkState(theEntry);
          }
        };
      })(entry);

      // Read in the image file as a data URL.
      hashReader.readAsBinaryString(f); 
      
  }

function checkState(theEntry){
  (function(theEntry){
    web3.eth.watch({altered: {at: addOffset(theEntry.getAttribute("name"),OFFSET_WORK), id: contractAddress}}).changed(function() {
      web3.eth.stateAt(contractAddress, addOffset(theEntry.getAttribute("name"),OFFSET_WORK)).then(function(result){        
        if(isNaN(result)) {
          // not there yet
          inputElement=theEntry.firstChild.firstChild;
          inputElement.setAttribute('onclick','registerFile("'+theEntry.getAttribute('name')+'");');
          inputElement.disabled=false;
        }
        else {
          // alread there
          if(theEntry.firstChild.firstChild && theEntry.firstChild.firstChild.nodeName=='INPUT'){
            theEntry.firstChild.removeChild(theEntry.firstChild.firstChild);
          }
          theEntry.firstChild.innerText=result;
        }
      });
    });
  })(theEntry);
  removeDuplicates();
}


function registerFile(hashcode) {
  var entry=document.getElementsByName(hashcode)[0];
  var filename=entry.getAttribute('filename');
  var date=entry.getAttribute('date');
  var size=entry.getAttribute('size');
  var type=entry.getAttribute('type');
  var checked = getCheckedBox("account");
  if (!checked) alert("check an id before registering");
  else {
    var data = ['0x1', hashcode];
    web3.eth.transact({to: contractAddress, data: data, from: checked, gas: 5000});
    alert(filename + " registered");
  }
}

function handleDropZone(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    handleFileInput(evt.dataTransfer);
}

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }



  function removeDuplicates(){
     var entries=document.getElementsByTagName("entry");
     var count=entries.length;
      // should use a better Algorithm...
      for(var i=0; i<count;i++){
        if(entries[i].getAttribute("name")!=null){
          for(var j=0; j<i;j++){
            if(entries[i].getAttribute("name")==entries[j].getAttribute("name")){
              entries[j].remove();
              removeDuplicates();
              return;
            }
          }       
        }
      }
  }

  function addTextElement(parent,name,text){
    var element=document.createElement(name);
    element.appendChild(document.createTextNode(text));
    parent.appendChild(element);
  }


function createTransaction() {
  var receiverAddress = document.querySelector('#receiverAddress').value;
  if (receiverAddress.substring(0,1)!="0x") receiverAddress = "0x"+receiverAddress;
  var amount = document.querySelector('#amount').value;

  var checked = getCheckedBox("account");
  if (!checked) alert("check a sender");
  else {
    var from=checked;
    var data = [from, receiverAddress, amount];
    web3.eth.transact({to: contractAddress, data: data, gas: 5000});
  }
}

function getCheckedBox(name){
  var checkboxen=document.getElementsByName(name);
  var i=0;
  while (i<checkboxen.length){
    if (checkboxen[i].checked) return checkboxen[i].value;
    i++;
  }
  return null;
}

function init_accounts(){
  web3.eth.accounts.then(function (accounts) {
    var i=accounts.length;
    while(i>0){
        i--;
        // copy row from template when not last
        var rowCopy=null;
      var rowTemplate=document.getElementById("rowTemplate");
      var account=accounts[i];
      if(i>0) rowCopy=rowTemplate.cloneNode(true);
      rowTemplate.removeAttribute("id");
      var radioTemplate=document.getElementById("radioTemplate");

      radioTemplate.removeAttribute("id");
      radioTemplate.setAttribute("value",account);
      var text=document.createTextNode(account);
      radioTemplate.parentNode.appendChild(text);
      document.getElementById("valueTemplate").id=account;

//      document.getElementById(account).innerText=web3.toDecimal(web3.eth.storageAt(contractAddress, addOffset(account,OFFSET_WORKCOUNT)));
      (function(account){
        web3.eth.watch({altered: {at: accounts[i], id: contractAddress}}).changed(function() {
          web3.eth.stateAt(contractAddress, account).then(function(result){
            if(isNaN(result)) document.getElementById(account).innerText='(no registered asset)';
            else document.getElementById(account).innerText = '(' + web3.toDecimal(result) + ' registered assets)';
          });
        });
      })(account);




      if(rowCopy) rowTemplate.parentNode.appendChild(rowCopy);

     }
  });
  // listProperties(web3);
}

function listProperties(obj) {
   var propList = "";
   for(var propName in obj) {
         propList += (propName + ", ");
   }
   alert(propList);
}


  function init()
  {   
    init_accounts();
    // if some files have already been selected when loading
    handleFileInput(document.getElementById('files'));
    document.getElementById('files').addEventListener('change', handleFileSelect, false);
    // Setup the Dropzone listeners.
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleDropZone, false);

  }
