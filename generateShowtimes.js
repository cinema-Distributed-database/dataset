const fs = require('fs');
const path = require('path');

// --- CẤU HÌNH ---
const CINEMAS_FILE = 'cinemas.json';
const ROOMS_FILE = 'rooms.jsonl'; 
const MOVIES_FILE = 'movies.json';
const OUTPUT_FILE = 'showtimes_realistic.jsonl';

const DAYS_TO_GENERATE = 3;
const MIN_SHOWS_PER_DAY = 0;
const MAX_SHOWS_PER_DAY = 3;
const SHOW_TIMES = ['09:30', '12:00', '14:30', '17:00', '19:30', '22:00'];
const BUFFER_SIZE = 1000;

// <<< CẤU HÌNH TỐI ƯU LOGIC >>>
// Tỉ lệ một rạp sẽ có suất chiếu trong một ngày. 0.95 = 95%
const CINEMA_ACTIVE_PROBABILITY = 0.95; 
// Số lượng phim khác nhau tối đa mà một rạp chiếu trong một ngày
const MAX_MOVIES_PER_CINEMA_PER_DAY = 5; 
// Tỉ lệ phòng tối thiểu và tối đa được sử dụng trong một rạp đang hoạt động
const MIN_ROOM_UTILIZATION = 0.7; // 70%
const MAX_ROOM_UTILIZATION = 1.0; // 100%


// --- CÁC HÀM ĐỌC FILE (giữ nguyên) ---
function readJsonFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        if (!fs.existsSync(filePath)) throw new Error(`File không tồn tại: ${filePath}`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Lỗi: Không thể đọc hoặc parse file '${filename}'.`, error);
        process.exit(1);
    }
}
function readJsonlFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        if (!fs.existsSync(filePath)) throw new Error(`File không tồn tại: ${filePath}`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        return lines.map((line) => JSON.parse(line));
    } catch (error) {
        console.error(`Lỗi: Không thể đọc hoặc xử lý file .jsonl '${filename}'.`, error);
        process.exit(1);
    }
}
function generateSeatInfoFromRoom(room) {
    const seatStatus = {};
    let totalSellableSeats = 0;
    if (room.seatMap && room.seatMap.rows) {
        for (const row of room.seatMap.rows) {
            for (const seat of row.seats) {
                if (seat.id) {
                    seatStatus[seat.id] = { status: 'available', holdStartedAt: null, bookingId: null };
                    totalSellableSeats++;
                }
            }
        }
    }
    return { seatStatus, totalSeats: totalSellableSeats };
}

// --- HÀM CHÍNH ĐÃ ĐƯỢC TỐI ƯU LOGIC ---
function main() {
    console.log(`Bắt đầu quá trình tạo file dữ liệu suất chiếu thực tế hơn cho ${DAYS_TO_GENERATE} ngày...`);
    
    // 1. Đọc và tính toán trước dữ liệu
    const cinemas = readJsonFile(CINEMAS_FILE);
    const rooms = readJsonlFile(ROOMS_FILE); 
    const allMovies = readJsonFile(MOVIES_FILE);
    const activeMovies = allMovies.filter(m => m.isActive === true);

    console.log("Đang tính toán trước thông tin ghế cho các phòng...");
    const precomputedRooms = rooms.map(room => ({ ...room, precomputedSeatInfo: generateSeatInfoFromRoom(room) }));
    const roomsByCinema = precomputedRooms.reduce((acc, room) => {
        if (!acc[room.cinemaId]) acc[room.cinemaId] = [];
        acc[room.cinemaId].push(room);
        return acc;
    }, {});
    console.log("Tính toán ghế hoàn tất.");

    const outputStream = fs.createWriteStream(path.join(__dirname, OUTPUT_FILE), { encoding: 'utf-8' });
    let writeBuffer = []; 
    let totalShowtimesGenerated = 0;
    const today = new Date();

    // 2. Vòng lặp tạo dữ liệu với logic thực tế hơn
    for (let i = 0; i < DAYS_TO_GENERATE; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');

        for (const cinema of cinemas) {
            // TỐI ƯU #1: Không phải rạp nào cũng hoạt động mỗi ngày
            if (Math.random() > CINEMA_ACTIVE_PROBABILITY) {
                continue; // Bỏ qua, rạp này "nghỉ" hôm nay
            }

            const allCinemaRooms = roomsByCinema[cinema._id];
            if (!allCinemaRooms || allCinemaRooms.length === 0) continue;

            // TỐI ƯU #2: Mỗi rạp chỉ chiếu một số lượng phim giới hạn
            const moviesToShowToday = [...activeMovies].sort(() => 0.5 - Math.random()).slice(0, MAX_MOVIES_PER_CINEMA_PER_DAY);
            if (moviesToShowToday.length === 0) continue;
            
            // TỐI ƯU #3: Mỗi rạp chỉ sử dụng một phần số phòng
            const utilizationRate = Math.random() * (MAX_ROOM_UTILIZATION - MIN_ROOM_UTILIZATION) + MIN_ROOM_UTILIZATION;
            const roomsInUseCount = Math.ceil(allCinemaRooms.length * utilizationRate);
            const roomsInUseToday = [...allCinemaRooms].sort(() => 0.5 - Math.random()).slice(0, roomsInUseCount);

            roomsInUseToday.forEach((room, roomIndex) => {
                const movieForThisRoom = moviesToShowToday[roomIndex % moviesToShowToday.length];
                const numShows = Math.floor(Math.random() * (MAX_SHOWS_PER_DAY - MIN_SHOWS_PER_DAY + 1)) + MIN_SHOWS_PER_DAY;
                const { seatStatus, totalSeats } = room.precomputedSeatInfo;
                if (totalSeats === 0) return;

                for (let j = 0; j < numShows; j++) {
                    const randomTime = SHOW_TIMES[Math.floor(Math.random() * SHOW_TIMES.length)];
                    const showDateTimeISO = `${year}-${month}-${day}T${randomTime}:00.000Z`;

                    const showtimeObject = {
                        _id: `show_${cinema._id}_${room._id}_${Date.parse(showDateTimeISO)}_${totalShowtimesGenerated}`,
                        movieId: movieForThisRoom._id,
                        cinemaId: cinema._id,
                        roomId: room._id,
                        showDateTime: { "$date": showDateTimeISO },
                        screenType: Math.random() > 0.3 ? '2D' : '3D',
                        pricingTiers: { standard: 75000, vip: 120000, couple: 200000 },
                        totalSeats: totalSeats,
                        availableSeats: totalSeats,
                        status: 'active',
                        seatStatus: seatStatus,
                        hasHoldingSeats: false
                    };
                    
                    writeBuffer.push(JSON.stringify(showtimeObject));
                    totalShowtimesGenerated++;

                    if (writeBuffer.length >= BUFFER_SIZE) {
                        outputStream.write(writeBuffer.join('\n') + '\n');
                        writeBuffer = [];
                    }
                }
            });
        }
    }

    if (writeBuffer.length > 0) {
        outputStream.write(writeBuffer.join('\n') + '\n');
    }
    
    outputStream.end();
    
    outputStream.on('finish', () => {
        console.log(`\n✅ Hoàn tất! Đã tạo và ghi thành công ${totalShowtimesGenerated} suất chiếu.`);
        console.log(`Dữ liệu đã được lưu vào file: ${OUTPUT_FILE}`);
    });

    outputStream.on('error', (err) => {
        console.error("❌ Đã xảy ra lỗi khi ghi tệp:", err);
    });
}

main();