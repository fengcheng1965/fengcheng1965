const API_BASE_URL = 'http://localhost:3000/api';
class API {
 constructor(baseURL = API_BASE_URL) {
 this.baseURL = baseURL;
 this.token = localStorage.getItem('token');
 }
 setToken(token) {
 this.token = token;
 localStorage.setItem('token', token);
 }
 removeToken() {
 this.token = null;
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 }
 async request(endpoint, options = {}) {
 const url = `${this.baseURL}${endpoint}`;
 const headers = {
 'Content-Type': 'application/json',
 ...options.headers
 };
 if (this.token) {
 headers['Authorization'] = `Bearer ${this.token}`;
 }
 try {
 const response = await fetch(url, {
 ...options,
 headers
 });
 const data = await response.json();
 if (!response.ok) {
 throw new Error(data.message || '请求失败');
 }
 return data;
 }
 catch (error) {
 if (error.message.includes('401') || error.message.includes('token')) {
 this.removeToken();
 window.location.href = '/admin/login.html';
 }
 throw error;
 }
 }
 login(credentials) {
 return this.request('/auth/login', {
 method: 'POST',
 body: JSON.stringify(credentials)
 });
 }
 register(userData) {
 return this.request('/auth/register', {
 method: 'POST',
 body: JSON.stringify(userData)
 });
 }
 getProfile() {
 return this.request('/auth/profile');
 }
 updateProfile(profileData) {
 return this.request('/auth/profile', {
 method: 'PUT',
 body: JSON.stringify(profileData)
 });
 }
 logout() {
 return this.request('/auth/logout', {
 method: 'POST'
 }).then(() => {
 this.removeToken();
 });
 }
 getCustomers(params = {}) {
 const queryString = new URLSearchParams(params).toString();
 return this.request(`/customers?${queryString}`);
 }
 getCustomerById(id) {
 return this.request(`/customers/${id}`);
 }
 createCustomer(customerData) {
 return this.request('/customers', {
 method: 'POST',
 body: JSON.stringify(customerData)
 });
 }
 updateCustomer(id, customerData) {
 return this.request(`/customers/${id}`, {
 method: 'PUT',
 body: JSON.stringify(customerData)
 });
 }
 deleteCustomer(id) {
 return this.request(`/customers/${id}`, {
 method: 'DELETE'
 });
 }
 getMessages(params = {}) {
 const queryString = new URLSearchParams(params).toString();
 return this.request(`/messages?${queryString}`);
 }
 getMessageById(id) {
 return this.request(`/messages/${id}`);
 }
 createMessage(messageData) {
 return this.request('/messages', {
 method: 'POST',
 body: JSON.stringify(messageData)
 });
 }
 replyMessage(id, replyContent) {
 return this.request(`/messages/${id}/reply`, {
 method: 'PUT',
 body: JSON.stringify({ replyContent })
 });
 }
 updateMessageStatus(id, status, closeReason) {
 return this.request(`/messages/${id}/status`, {
 method: 'PUT',
 body: JSON.stringify({ status, closeReason })
 });
 }
 deleteMessage(id) {
 return this.request(`/messages/${id}`, {
 method: 'DELETE'
 });
 }
 getMessageStats() {
 return this.request('/messages/stats');
 }
}
const api = new API();
window.api = api;
export default api;
