
# 📱 TrueGift - Ứng dụng kết nối và chia sẻ

**TrueGift** là một ứng dụng di động được phát triển bằng **React Native** với **Expo**, giúp người dùng kết nối với bạn bè, nhắn tin, và chia sẻ những khoảnh khắc đáng nhớ. Ứng dụng tích hợp các tính năng xác thực hiện đại, quản lý bạn bè và tin nhắn trực tiếp.

---

## 1.🚀 Tính năng chính

### 🔐 Xác thực
- Đăng ký & đăng nhập bằng email/mật khẩu
- Đăng nhập với Google và Facebook
- Xác minh email
- Quên & đặt lại mật khẩu

### 👥 Quản lý bạn bè
- Tìm kiếm và gửi lời mời kết bạn
- Chấp nhận / Từ chối lời mời
- Danh sách bạn bè
- Chặn / Bỏ chặn người dùng

### 💬 Nhắn tin
- Nhắn tin trực tiếp với bạn bè
- Xem lịch sử trò chuyện
- Đánh dấu tin nhắn đã đọc
- Xóa tin nhắn

---

### ⚙️ Yêu cầu hệ thống

- **Node.js** (v14 trở lên)  
- **npm** hoặc **yarn**  
- Môi trường phát triển **React Native**  
- **Expo CLI** (nếu sử dụng Expo)

---

## 2. 🛠️ Cài đặt

   #### 1. Clone repository

      git clone https://github.com/Kinebeo/truegift-app.git
      cd truegift-app
      

   #### 2. Cài đặt dependencies
      
      npm install
   

---

## 🔧 Cấu hình kết nối API

#### 1. Mở file `api.ts`
#### 2. Cập nhật url backend:
   ```ts
   export const API_URL = 'https://example.ngrok-free.app'; 
   ```

---

## 3. ▶️ Chạy ứng dụng

### Với Expo:
```bash
npx expo start
```

- Tải app expo trên điện thoại rồi quét QR của terminal 
---

## 📁 Cấu trúc thư mục

- `/src`: Mã nguồn chính của ứng dụng
- `/components`: Các component dùng chung
- `/screens`: Các màn hình chính
- `/services`: Cấu hình API và gọi backend
- `/assets`: Hình ảnh, fonts, icon
- `api.ts`: File cấu hình URL kết nối backend

---

## 🧪 Testing

### Xử lý sự cố thường gặp

#### Không thể kết nối API
- Kiểm tra URL API trong `api.ts`
- Nếu dùng thiết bị thật, không dùng `localhost` → ngrok
- Đảm bảo backend đang chạy: 
   - Docker đã chạy: docker compose up -d
   - Localhost backend đã chạy: npm run start:dev
   - Ngrok đã chạy: 
       ```ts 
         1. brew install ngrok
         2. ngrok config add-authtoken yourToken
         3. ngrok http http://localhost:3000 (port backend)

      ```

#### Lỗi xác thực
- Kiểm tra token được lưu trữ đúng cách
- Đảm bảo thông tin đăng nhập chính xác

---