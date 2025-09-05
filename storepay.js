const inputs = document.querySelectorAll(".phone-input");
 let countdownInterval;
 let requestId = null;
 let accessToken = null;
 let tokenExpirationTime = 0;

 // Утасны дугаарыг оруулах хэсэг
 inputs.forEach((input, index) => {
 input.addEventListener("input", (event) => {
 if (event.inputType !== "deleteContentBackward") {
 if (input.value && index < inputs.length - 1) {
 inputs[index + 1].focus();
 }
 }
 });

 input.addEventListener("keydown", (event) => {
 if (event.key === "Backspace" && !input.value && index > 0) {
 inputs[index - 1].focus();
 }
 });
 });

// Storepay API тохиргоо
const AUTH_URL = "https://service.storepay.mn/merchant-uaa/oauth/token";
const CLIENT_ID = "merchantapp1";
const CLIENT_SECRET = "EnRZA3@B";

const USERNAME = "90095251";
const PASSWORD = "90095251";

window.accessToken = null;
window.refreshToken = null;
let isFetchingToken = false; // Token давхар авахыг зогсоох флаг

// 🔹 Basic Authorization Header бэлдэх функц
function getBasicAuthHeader() {
 const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
 return `Basic ${btoa(credentials)}`;
}

// 🔹 Token авах функц (Basic Auth ашиглана)
async function getAccessToken() {
 if (isFetchingToken || window.accessToken) return window.accessToken; // Давхар дуудахгүй

 isFetchingToken = true; // Token авч эхэлсэн гэж тэмдэглэнэ
 const body = new URLSearchParams();
 body.append("grant_type", "password");
 body.append("username", USERNAME);
 body.append("password", PASSWORD);

 try {
 const response = await fetch(AUTH_URL, {
 method: "POST",
 headers: {
 "Authorization": getBasicAuthHeader(),
 "Content-Type": "application/x-www-form-urlencoded"
 },
 body: body
 });

 const data = await response.json();
 isFetchingToken = false; // Token авах ажиллагаа дууссан

 if (data.access_token) {
 window.accessToken = data.access_token;
 window.refreshToken = data.refresh_token;
 console.log("✅:", window.accessToken);
 return window.accessToken;
 } else {
 console.error("❌ Token авахад алдаа:", data);
 throw new Error("Token авахад алдаа.");
 }
 } catch (error) {
 isFetchingToken = false;
 console.error("❌ Token авахад алдаа:", error);
 throw error;
 }
}

// 🔹 Refresh token ашиглан access token шинэчлэх функц
async function refreshAccessToken() {
 if (window.refreshToken) {
 const body = new URLSearchParams();
 body.append("grant_type", "refresh_token");
 body.append("refresh_token", window.refreshToken);

 try {
 const response = await fetch(AUTH_URL, {
 method: "POST",
 headers: {
 "Authorization": getBasicAuthHeader(),
 "Content-Type": "application/x-www-form-urlencoded"
 },
 body: body
 });

 const data = await response.json();

 if (data.access_token) {
 window.accessToken = data.access_token;
 console.log("✅ Шинэ access_token:", window.accessToken);
 } else {
 console.error("❌ Refresh token ашиглан шинэ access_token авахад алдаа:", data);
 }
 } catch (error) {
 console.error("❌ Refresh token ашиглахад алдаа:", error);
 }
 } else {
 console.error("Refresh token байхгүй байна!");
 }
}

// 2 цаг тутамд шинэ access_token авах
setInterval(refreshAccessToken, 2 * 60 * 60 * 1000); // 2 цаг = 2 * 60 * 60 * 1000ms

// 🚀 Token-г эхлээд нэг удаа авах
getAccessToken();


 // Нэхэмжлэл илгээх
 async function createInvoice() {
 try {
 const token = await getAccessToken(); // Token авах

 const url = "https://service.storepay.mn/merchant/loan";
 let mobileNumber = "";
 inputs.forEach(input => {
 mobileNumber += input.value;
 });
 
 console.log("Илгээж буй mobileNumber:", mobileNumber);
 
 if (mobileNumber.length !== 8) {
 showPopup("Утасны дугаарыг бүрэн оруулна уу!"); 
 return;
 }

 const amountElement = document.querySelector(".id-good-2-price");
 if (!amountElement) {
 showPopup("Мөнгөн дүн олдсонгүй!");
 return;
 }

 const amountText = amountElement.textContent.trim();
 const amount = parseInt(amountText.replace(/[^\d]/g, ""), 10); 

 if (isNaN(amount) || amount <= 0) {
 showPopup("Мөнгөн дүн буруу байна!");
 return;
 }
 console.log("Цэвэр мөнгөн дүн:", amount);
 if (amount < 100000) {
 showPopup("Уучлаарай, 100,000₮-с дээш худалдан авалтад ашиглах боломжтой.");
 return;
 }

 const invoiceData = {
 storeId: "25071",
 mobileNumber: mobileNumber, 
 description: "test",
 amount: amount,
 callbackUrl: `https://merchant-tchibo.mn/webhook?id=${requestId}`
 };

 const response = await fetch(url, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`
 },
 body: JSON.stringify(invoiceData)
 });


 const result = await response.json();
 
 console.log("API хариу:", result);
 
 requestId = result.requestId;

 showPopup(result.message || "Нэхэмжлэлийн хүсэлт амжилттай илгээгдлээ.", 120);

 } catch (error) {
 console.error("Алдаа:", error);
 showPopup("Алдаа гарлаа. Дахин оролдож үзээрэй.");
 }
 }

 // Popup харуулах
 function showPopup(message, minutes) {
 clearInterval(countdownInterval);

 const popup = document.getElementById("popup");
 const responseMessage = document.getElementById("apiResponseMessage");
 popup.style.display = "block";
 responseMessage.textContent = message;

 if (minutes) {
 startCountdown(minutes * 60);
 }
 }

 // Popup харуулах
function showPopup(message, minutes) {
 clearInterval(countdownInterval);

 const popup = document.getElementById("popup");
 const responseMessage = document.getElementById("apiResponseMessage");
 popup.style.display = "block";
 responseMessage.textContent = message;

 if (minutes) {
 startCountdown(minutes * 60);
 }
}

// Хугацаа тоолох
function startCountdown(duration) {
 let timer = duration;
 const countdownElement = document.getElementById("countdown");

 countdownInterval = setInterval(() => {
 const minutes = Math.floor(timer / 60);
 const seconds = timer % 60;
 countdownElement.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

 if (--timer < 0) {
 clearInterval(countdownInterval);
 countdownElement.textContent = "Хугацаа дууссан!";
 }
 }, 1000);
}

// Хаах
function closePopup() {
 document.getElementById("popup").style.display = "none";
}

// Хүсэлт илгээх товч
document.getElementById("payButton").addEventListener("click", () => {
 createInvoice();
 // requestId-ийг шалгах боломжтой бол дараа нь шалгаж болно
 if (requestId) {
 checkPaymentStatus(requestId);
 }
});


 // 🔹 Төлбөрийн статус шалгах
async function checkPaymentStatus(requestId) {
 const checkUrl = `https://service.storepay.mn/merchant/loan/checkRequest/${requestId}`;
 try {
 const response = await fetch(checkUrl, {
 method: "GET",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${await getAccessToken()}` // Access Token-г шууд авна
 }
 });

 const result = await response.json();
 console.log("Шалгах хариу:", result);

 if (result.status === "paid") {
 document.getElementById("apiResponseMessage").textContent = "Төлбөр баталгаажлаа!";
 } else if (result.status === "cancelled") {
 document.getElementById("apiResponseMessage").textContent = "Төлбөр цуцлагдлаа!";
 } else {
 document.getElementById("apiResponseMessage").textContent = "Төлбөрийн байдал тодорхойгүй байна!";
 }

 } catch (error) {
 console.error("Алдаа:", error);
 document.getElementById("apiResponseMessage").textContent = "Төлбөрийн статус шалгахад алдаа гарлаа.";
 }
}
