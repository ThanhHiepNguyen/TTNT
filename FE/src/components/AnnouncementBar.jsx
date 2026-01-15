const AnnouncementBar = () => {
  const announcements = [
    "📱 Điện thoại chính hãng 100%",
    "🚚 Freeship đơn từ 15K",
    "🔥 Giảm giá đến 5 triệu",
    "🎁 Quà tặng kèm hấp dẫn",
    "🛡 Bảo hành chính hãng 12 tháng",
    "🔄 Đổi trả 7 ngày nếu lỗi",
    "💳 Trả góp 0% lãi suất",
    "🚀 Giao nhanh toàn quốc",
  ];

  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-600 to-purple-700 text-white py-2.5 overflow-hidden relative">
      <div className="flex items-center space-x-8 animate-marquee whitespace-nowrap">
        {announcements.map((announcement, index) => (
          <span key={index} className="text-sm font-medium flex-shrink-0">
            {announcement}
          </span>
        ))}
        {announcements.map((announcement, index) => (
          <span key={`dup-${index}`} className="text-sm font-medium flex-shrink-0">
            {announcement}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;

