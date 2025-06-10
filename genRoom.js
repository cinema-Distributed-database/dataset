const fs = require("fs");

// --- 1. Đọc dữ liệu từ tệp cinemas.json ---
let cinemasData;
const inputFilename = "cinemas.json";
const outputFilename = "rooms.jsonl"; // Đổi đuôi tệp thành .jsonl

try {
  if (!fs.existsSync(inputFilename)) {
    throw new Error(`Tệp đầu vào "${inputFilename}" không tồn tại.`);
  }
  const fileContent = fs.readFileSync(inputFilename, "utf8");
  cinemasData = JSON.parse(fileContent);
  console.log(
    `✅ Đã đọc thành công ${cinemasData.length} rạp từ tệp ${inputFilename}.`,
  );
} catch (err) {
  console.error(`❌ Lỗi khi đọc tệp ${inputFilename}:`, err.message);
  process.exit(1);
}

// --- Các hàm và dữ liệu trợ giúp (giữ nguyên) ---

function generateSeatMap() {
  const rowsChars = "ABCDEFGHIJKL".split("");
  const numRows = Math.floor(Math.random() * (10 - 8 + 1)) + 8;
  const numCols = Math.floor(Math.random() * (18 - 14 + 1)) + 14;

  const seatMap = {
    rows: [],
    metadata: {
      totalSeats: 0,
      totalSellableSeats: 0,
      seatTypes: {
        standard: { basePrice: 75000, color: "#A0A0A0", label: "Standard" },
        vip: { basePrice: 120000, color: "#D4AF37", label: "VIP" },
        couple: { basePrice: 200000, color: "#FF69B4", label: "Couple" },
      },
      screen: { label: "Màn Chiếu", position: "front" },
    },
  };
  let totalSellableSeats = 0;

  for (let i = 0; i < numRows; i++) {
    const rowId = rowsChars[i];
    const row = { id: rowId, seats: [] };
    for (let j = 1; j <= numCols; j++) {
      seatMap.metadata.totalSeats++;
      if (numCols > 12 && (j === 4 || j === numCols - 3)) {
        row.seats.push({ type: "corridor" });
        continue;
      }
      let seatType = "standard";
      if (i >= numRows - 2) seatType = "vip";
      if (i === numRows - 1 && j % 5 === 0) seatType = "couple";
      row.seats.push({ id: `${rowId}${j}`, type: seatType });
      totalSellableSeats++;
    }
    seatMap.rows.push(row);
  }
  seatMap.metadata.totalSellableSeats = totalSellableSeats;
  return seatMap;
}

function generateRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  ).toISOString();
}

function getRandomItems(arr, numItems) {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, numItems);
}

const roomTypes = ["2D", "3D", "VIP", "IMAX"];
const allFeatures = [
  "Âm thanh Dolby Atmos",
  "Màn hình cong",
  "Công nghệ 3D",
  "Ghế ngồi rộng rãi",
  "Chiếu phim Laser",
];

// --- 2. Tạo luồng ghi và xử lý dữ liệu ---

// *** THAY ĐỔI QUAN TRỌNG: Mở một luồng để ghi file ***
const writeStream = fs.createWriteStream(outputFilename, { encoding: "utf8" });

let totalRoomsGenerated = 0;

cinemasData.forEach((cinema) => {
  const cinemaId = cinema._id;
  const roomCount = cinema.roomCount;

  if (!cinemaId || !roomCount || roomCount <= 0) {
    return;
  }

  for (let i = 1; i <= roomCount; i++) {
    const seatMapData = generateSeatMap();
    const lastMaintenance = generateRandomDate(
      new Date(2024, 0, 1),
      new Date(),
    );
    const nextMaintenanceScheduled = generateRandomDate(
      new Date(),
      new Date(2025, 11, 31),
    );

    const room = {
      _id: `${cinemaId}_room_${i}`,
      cinemaId: cinemaId,
      roomNumber: String(i),
      name: `Phòng ${i}`,
      type: roomTypes[Math.floor(Math.random() * roomTypes.length)],
      capacity: seatMapData.metadata.totalSellableSeats,
      status: "active",
      features: getRandomItems(allFeatures, 3),
      seatMap: seatMapData,
      lastMaintenance: lastMaintenance,
      nextMaintenanceScheduled: nextMaintenanceScheduled,
    };

    // *** THAY ĐỔI QUAN TRỌNG: Ghi từng đối tượng room ra file, mỗi room một dòng ***
    const roomJsonLine = JSON.stringify(room);
    writeStream.write(roomJsonLine + "\n"); // Thêm ký tự xuống dòng

    totalRoomsGenerated++;
  }
});

// --- 3. Đóng luồng và thông báo hoàn tất ---
writeStream.end();

writeStream.on("finish", () => {
  console.log(
    `✅ Hoàn tất! Đã tạo và ghi thành công ${totalRoomsGenerated} phòng vào tệp ${outputFilename}.`,
  );
});

writeStream.on("error", (err) => {
  console.error("❌ Đã xảy ra lỗi khi ghi tệp:", err);
});
