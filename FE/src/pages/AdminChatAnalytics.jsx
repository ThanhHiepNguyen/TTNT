import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { chatService } from "../api/services/chatService";

export default function AdminChatAnalytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await chatService.getChatAnalytics(days);
      setData(res?.data?.data || res?.data || res);
    } catch (e) {
      setError(e?.response?.data?.message || "Không tải được thống kê (kiểm tra quyền ADMIN / đăng nhập).");
      setData(null);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, [days]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Chat Analytics</h1>

          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={90}>90 ngày</option>
          </select>
        </div>

        {loading && <p>Đang tải...</p>}
        {!loading && error && <p className="text-red-600 text-sm">{error}</p>}
        {!loading && data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="border rounded p-3 bg-white">
                <div className="text-sm text-gray-500">User messages</div>
                <div className="text-2xl font-bold">{data.totalMessages}</div>
              </div>
              <div className="border rounded p-3 bg-white">
                <div className="text-sm text-gray-500">VI</div>
                <div className="text-2xl font-bold">{data.byLang?.vi || 0}</div>
              </div>
              <div className="border rounded p-3 bg-white">
                <div className="text-sm text-gray-500">EN</div>
                <div className="text-2xl font-bold">{data.byLang?.en || 0}</div>
              </div>
              <div className="border rounded p-3 bg-white">
                <div className="text-sm text-gray-500">Mơ hồ</div>
                <div className="text-2xl font-bold">{data.ambiguousCount || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border rounded p-3 bg-white">
                <h2 className="font-semibold mb-2">Intent</h2>
                <ul className="text-sm space-y-1">
                  {Object.entries(data.byIntent || {}).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span>{k}</span>
                      <span className="font-medium">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border rounded p-3 bg-white">
                <h2 className="font-semibold mb-2">Top câu hỏi</h2>
                <div className="space-y-2">
                  {(data.topQuestions || []).map((x, idx) => (
                    <div key={idx} className="border rounded p-2">
                      <div className="text-sm">{x.question}</div>
                      <div className="text-xs text-gray-500">Count: {x.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
