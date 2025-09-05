// ⚡ Info icon click - дэлгэрэнгүй
const storepayContent = `
<img src="https://tchibo.mn/img/Storepaybanner.jpg"/>
<h3>Storepay</h3>
<p>Үнийн дүнд санаа зоволтгүй хүссэн бүхнээ хүүгүй, шимтгэлгүй одоо аваад, дараа төлөх боломж.</p>
<p>🕒 <strong>Төлөлтийн нөхцөл:</strong> 45 хоногт 4 хувааж, 60 хоногт 3 хувааж, 4 сард 5 хувааж, 60 хоногт 4 хувааж</p>
<h4>Заавар</h4>
<p>1. Бараануудаа сагсандаа нэмнэ.<br>2. Төлбөрийн нөхцөл дээрээс Сторпэй-г сонгоно.<br>3. Сторпэй аппликейшнд нэхэмжлэх ирж, эхний төлөлтөө баталгаажуулна.</p>
`;
document.querySelector('.info-icon').addEventListener('click', (e)=>{
  showDetails(e, 'Storepay', storepayContent);
});

// ⚡ Popup show/hide
const popupContainer = document.getElementById('popup-container');
const popupClose = document.getElementById('popup-close');
document.getElementById('open-popup').addEventListener('click', ()=> popupContainer.style.display='flex');
popupClose.addEventListener('click', ()=> popupContainer.style.display='none');

// ⚡ Phone input auto-focus
const inputs = document.querySelectorAll(".phone-input");
inputs.forEach((input, index)=>{
  input.addEventListener("input", e=>{
    if(input.value && index<inputs.length-1) inputs[index+1].focus();
  });
  input.addEventListener("keydown", e=>{
    if(e.key==='Backspace' && !input.value && index>0) inputs[index-1].focus();
  });
});

// ⚡ QR код үүсгэх
document.getElementById('showQRCodeButton').addEventListener('click', ()=>{
  let amountEl = document.querySelector('.id-good-2-price');
  if(!amountEl) return alert('Мөнгөн дүн олдсонгүй!');
  let amount = parseInt(amountEl.textContent.replace(/[^\d]/g,''),10);
  if(isNaN(amount)) return alert('Мөнгөн дүн буруу байна!');
  new QRCode(document.getElementById('newQRCodePopup'), {
    text: JSON.stringify({storeCode:"25071",description:"tchibo.mn",amount:amount}),
    width:128,height:128,colorDark:"#000000",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.H
  });
  document.getElementById('newQRCodePopupContainer').style.display='block';
});
document.getElementById('closeNewQRCodePopup').addEventListener('click', ()=>{
  document.getElementById('newQRCodePopupContainer').style.display='none';
});

// ⚡ Popup show/hide
function showPopup(msg, minutes){
  clearInterval(window.countdownInterval);
  const popup = document.getElementById('popup');
  const responseMessage = document.getElementById('apiResponseMessage');
  popup.style.display='block';
  responseMessage.textContent=msg;
  if(minutes) startCountdown(minutes*60);
}
function closePopup(){document.getElementById('popup').style.display='none';}
function startCountdown(duration){
  let timer = duration;
  const countdownEl = document.getElementById('countdown');
  window.countdownInterval = setInterval(()=>{
    const m = Math.floor(timer/60); const s = timer%60;
    countdownEl.textContent=`${m}:${s<10?'0':''}${s}`;
    if(--timer<0){clearInterval(window.countdownInterval);countdownEl.textContent='Хугацаа дууссан!';}
  },1000);
}

// ⚡ Storepay API (access token авах & invoice үүсгэх)
const AUTH_URL="https://service.storepay.mn/merchant-uaa/oauth/token";
const CLIENT_ID="merchantapp1", CLIENT_SECRET="EnRZA3@B";
const USERNAME="90095251", PASSWORD="90095251";
window.accessToken=null; window.refreshToken=null; let isFetchingToken=false;

function getBasicAuthHeader(){return "Basic "+btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);}
async function getAccessToken(){
  if(isFetchingToken || window.accessToken) return window.accessToken;
  isFetchingToken=true;
  const body=new URLSearchParams();
  body.append("grant_type","password"); body.append("username",USERNAME); body.append("password",PASSWORD);
  try{
    const res = await fetch(AUTH_URL,{method:'POST',headers:{"Authorization":getBasicAuthHeader(),"Content-Type":"application/x-www-form-urlencoded"},body:body});
    const data=await res.json();
    isFetchingToken=false;
    if(data.access_token){window.accessToken=data.access_token;window.refreshToken=data.refresh_token;return window.accessToken;}
    else throw new Error("Token авахад алдаа");
  }catch(e){isFetchingToken=false;console.error(e); throw e;}
}
async function refreshAccessToken(){
  if(!window.refreshToken) return console.error("Refresh token байхгүй!");
  const body=new URLSearchParams(); body.append("grant_type","refresh_token"); body.append("refresh_token",window.refreshToken);
  try{
    const res = await fetch(AUTH_URL,{method:'POST',headers:{"Authorization":getBasicAuthHeader(),"Content-Type":"application/x-www-form-urlencoded"},body:body});
    const data=await res.json();
    if(data.access_token) window.accessToken=data.access_token;
  }catch(e){console.error(e);}
}
setInterval(refreshAccessToken,2*60*60*1000);
getAccessToken();

// ⚡ Invoice үүсгэх
let requestId=null;
document.getElementById('payButton').addEventListener('click', async()=>{
  const mobileNumber = Array.from(inputs).map(i=>i.value).join('');
  if(mobileNumber.length!==8){showPopup("Утасны дугаарыг бүрэн оруулна уу!"); return;}
  const amountEl = document.querySelector(".id-good-2-price");
  const amount = parseInt(amountEl.textContent.replace(/[^\d]/g,''),10);
  if(isNaN(amount) || amount<100000){showPopup("100,000₮-с дээш худалдан авалтад л боломжтой."); return;}
  try{
    const token = await getAccessToken();
    const res = await fetch("https://service.storepay.mn/merchant/loan",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({storeId:"25071",mobileNumber,description:"test",amount,callbackUrl:`https://merchant-tchibo.mn/webhook?id=${requestId}`})});
    const data = await res.json();
    requestId=data.requestId;
    showPopup(data.message || "Нэхэмжлэлийн хүсэлт амжилттай илгээгдлээ.",120);
  }catch(e){console.error(e); showPopup("Алдаа гарлаа. Дахин оролдож үзээрэй.");}
});

// ⚡ Payment status шалгах
async function checkPaymentStatus(requestId){
  try{
    const res = await fetch(`https://service.storepay.mn/merchant/loan/checkRequest/${requestId}`,{method:"GET",headers:{"Authorization":"Bearer "+await getAccessToken(),"Content-Type":"application/json"}});
    const data = await res.json();
    const msg = data.status==="paid"?"Төлбөр баталгаажлаа!":data.status==="cancelled"?"Төлбөр цуцлагдлаа!":"Төлбөрийн байдал тодорхойгүй байна!";
    document.getElementById("apiResponseMessage").textContent=msg;
  }catch(e){console.error(e); document.getElementById("apiResponseMessage").textContent="Төлбөрийн статус шалгахад алдаа гарлаа.";}
}
