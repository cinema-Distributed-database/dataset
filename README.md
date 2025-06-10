# Hướng dẫn tạo và nhập dữ liệu cho hệ thống rạp chiếu phim

Tài liệu này mô tả quy trình để tạo và nhập toàn bộ dữ liệu cần thiết cho một hệ thống quản lý rạp chiếu phim vào cơ sở dữ liệu MongoDB.

## Yêu cầu

Trước khi bắt đầu, hãy đảm bảo bạn đã có:
1.  **Node.js:** Đã cài đặt trên hệ thống để chạy các tệp kịch bản (`.js`).
2.  **MongoDB Database Tools:** Đã cài đặt và cấu hình PATH đúng cách để có thể sử dụng lệnh `mongoimport`.
3.  **Các tệp dữ liệu nguồn:** Các tệp sau phải có sẵn trong thư mục gốc của dự án.
    * `cinemas.json`: Chứa danh sách các rạp chiếu phim.
    * `movies.json`: Chứa danh sách các bộ phim.
    * `concessions.json`: Chứa danh sách các loại đồ ăn, thức uống.

## Phần 1: Tạo Dữ liệu Phụ trợ

Một số dữ liệu như phòng chiếu và lịch chiếu cần được tạo ra từ các dữ liệu nguồn. Hãy chạy các kịch bản sau theo đúng thứ tự.

### Bước 1.1: Tạo dữ liệu Phòng chiếu (`rooms.jsonl`)
Kịch bản `genRoom.js` sẽ đọc tệp `cinemas.json` và dựa vào `roomCount` của mỗi rạp để tạo ra danh sách các phòng chiếu chi tiết.

1.  Mở terminal (PowerShell hoặc CMD) tại thư mục gốc của dự án.
2.  Chạy lệnh sau:
    ```bash
    node genRoom.js
    ```
3.  Sau khi chạy xong, một tệp mới tên là **`rooms.jsonl`** sẽ được tạo ra.

### Bước 1.2: Tạo dữ liệu Lịch chiếu (`showtimes.jsonl`)
Kịch bản `generateShowtimes.js` sẽ đọc `movies.json` và `rooms.jsonl` để tạo ra các suất chiếu ngẫu nhiên.
Có thể điều chỉnh giá trị DAYS_TO_GENERATE = 3 để có được số showtime chiếu cần thiết

1.  Đảm bảo bạn đã chạy thành công **Bước 1.1** và có tệp `rooms.jsonl`.
2.  Tại terminal, chạy lệnh sau:
    ```bash
    node generateShowtimes.js
    ```
3.  Sau khi chạy xong, một tệp mới tên là **`showtimes.jsonl`** sẽ được tạo ra.

## Phần 2: Import Toàn bộ Dữ liệu vào MongoDB

Sau khi đã có đầy đủ các tệp dữ liệu, bạn có thể bắt đầu nhập chúng vào MongoDB.

**Lưu ý quan trọng:**
* Thay thế `your_database_name` trong các lệnh dưới đây bằng tên cơ sở dữ liệu thực tế của bạn (ví dụ: `cinema_booking`).
* Đối với các tệp `.json` (chứa một mảng lớn), chúng ta dùng cờ `--jsonArray`.
* Đối với các tệp `.jsonl` (mỗi dòng một đối tượng), chúng ta **không** dùng cờ `--jsonArray`.

#### 1. Import Rạp chiếu phim (cinemas)
```bash
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection cinemas --file cinemas.json --jsonArray
```

#### 2. Import Phim (movies)
```bash
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection movies --file movies.json --jsonArray
```

#### 3. Import Đồ ăn & Thức uống (concessions)
```bash
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection concessions --file concessions.json --jsonArray
```

#### 4. Import Phòng chiếu (rooms)
*Lưu ý: Nhập từ tệp `rooms.jsonl` đã tạo ở Phần 1.*
```bash
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection rooms --file rooms.jsonl
```

#### 5. Import Lịch chiếu (showtimes)
*Lưu ý: Nhập từ tệp `showtimes.jsonl` đã tạo ở Phần 1.*
```bash
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection showtimes --file showtimes.jsonl
```

---
## Tóm tắt quy trình (Tất cả các lệnh)
Để thực hiện toàn bộ quá trình từ đầu đến cuối, hãy chạy lần lượt các lệnh sau:

```bash
# Bước 1: Tạo dữ liệu
node genRoom.js
node generateShowtimes.js

# Bước 2: Import dữ liệu (thay your_database_name)
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection cinemas --file cinemas.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection movies --file movies.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection concessions --file concessions.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection rooms --file rooms.jsonl
mongoimport --uri "mongodb://localhost:27017/your_database_name" --collection showtimes --file showtimes.jsonl
```