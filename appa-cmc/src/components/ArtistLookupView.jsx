import { useState, useMemo, useEffect } from 'react'
import { GOOGLE_SHEET_APIS, PROXY_BATCH_URL, PROXY_CONFIG } from '../data/googleSheetConfig'
import { fetchArtistNotes, createArtistNote, updateArtistNote, deleteArtistNote, fetchStaff } from '../api'

// Dữ liệu mẫu dự phòng khi chưa kết nối Google Sheet thành công
const FALLBACK_ARTISTS = [
  {
    id: 1,
    cmsIndex: 1248,
    name: 'APJ',
    englishName: 'APJ',
    type: 'MAN SOLO',
    artistClass: 'ARTIST',
    country: 'Việt Nam',
    company: 'Độc lập',
    workPhone: '0964041788',
    workEmail: 'Booking@spacespeakers.vn',
    managerNote: '',
    debutYear: '2017',
    birthday: '04/04/1996',
    bio: 'Tham gia Underground cuối năm 2017. Được mọi người biết đến qua những bài hát rnb luyến láy...',
    instagram: 'https://www.instagram.com/aypichay/',
    facebook: 'https://www.facebook.com/APJ.Melody/',
    twitter: '',
    tiktok: '',
    youtube: 'https://www.youtube.com/@APJmb',
    threads: 'https://www.threads.net/@aypichay',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'
  }
];

// Danh sách nhân viên hệ thống mẫu phục vụ chọn "Người liên hệ" (fallback khi chưa load được từ API)
const FALLBACK_STAFF_LIST = [
  { id: 1, name: 'Admin' },
  { id: 2, name: 'Đinh Thị Minh Phương' },
  { id: 3, name: 'Nguyễn Minh Thư' },
  { id: 4, name: 'Nguyễn Đức Huy' }, 
  { id: 5, name: 'Nguyễn Thị Hằng' },
  { id: 6, name: 'Nguyễn Thu Hằng' }
];

function parseNoteTimestamp(note) {
  if (note?.createdAt) {
    const raw = String(note.createdAt).trim();
    const direct = Date.parse(raw);
    if (!Number.isNaN(direct)) return direct;

    // Hỗ trợ định dạng DD/MM/YYYY HH:mm:ss hoặc DD-MM-YYYY
    const match = raw.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
    );
    if (match) {
      const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
      const parsed = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      ).getTime();
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return Number(note?.id) || 0;
}

function isIndependentCompany(companyValue) {
  const normalized = String(companyValue || '').trim().toLowerCase();
  if (!normalized || normalized === '—' || normalized === '-') return true;
  return (
    normalized.includes('độc lập') ||
    normalized.includes('doc lap') ||
    normalized.includes('independent') ||
    normalized.includes('tự do') ||
    normalized.includes('tu do')
  );
}

export default function ArtistLookupView() {
  const [searchType, setSearchType] = useState('artist'); // 'artist' | 'company' | 'status'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTimeSort, setStatusTimeSort] = useState('newest'); // 'newest' | 'oldest'
  const [onlyIndependentArtists, setOnlyIndependentArtists] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [artists, setArtists] = useState(FALLBACK_ARTISTS);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [failedSources, setFailedSources] = useState([]);

  // State quản lý popup "Nhập ghi chú"
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [noteContactPerson, setNoteContactPerson] = useState('');
  const [noteChannel, setNoteChannel] = useState('');
  const [noteChannelValue, setNoteChannelValue] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // State lưu danh sách lịch sử ghi chú ("Tình trạng liên hệ") - từ backend
  const [contactNotes, setContactNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // Danh sách nhân viên hệ thống (từ API)
  const [staffList, setStaffList] = useState(FALLBACK_STAFF_LIST);

  // State modal Sửa ghi chú trong tab Tình trạng liên hệ
  const [editingNote, setEditingNote] = useState(null);

  // Load danh sách ghi chú từ backend khi component mount
  useEffect(() => {
    loadNotes();
    loadStaff();
  }, []);

  const loadNotes = async () => {
    setNotesLoading(true);
    try {
      const data = await fetchArtistNotes();
      setContactNotes(data.notes || []);
    } catch (err) {
      console.error('Lỗi khi tải ghi chú:', err);
      setContactNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await fetchStaff();
      if (data.staff && data.staff.length > 0) {
        setStaffList(data.staff.map(s => ({ id: s.id, name: s.name })));
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách nhân viên:', err);
    }
  };

  // Hàm fetch dữ liệu có thể gọi lại thủ công (dùng batch proxy)
  const fetchArtistsData = async () => {
    setIsLoading(true);
    setFetchError(false);
    setFailedSources([]);

    try {
      const res = await fetch(PROXY_BATCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: GOOGLE_SHEET_APIS,
          concurrency: PROXY_CONFIG.concurrency,
          timeoutMs: PROXY_CONFIG.timeoutMs,
          maxRetries: PROXY_CONFIG.maxRetries,
        }),
      });

      if (!res.ok) throw new Error(`Proxy batch HTTP error! status: ${res.status}`);
      const resultMap = await res.json();

      const failed = Object.entries(resultMap)
        .filter(([, r]) => !r.ok)
        .map(([url]) => url);
      setFailedSources(failed);

      const combinedRawData = Object.values(resultMap)
        .filter(r => r.ok && r.body)
        .flatMap(r => {
          try {
            const parsed = JSON.parse(r.body);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        });

      if (Array.isArray(combinedRawData) && combinedRawData.length > 0) {
        const formattedData = combinedRawData.map((row, index) => {
          const getVal = (possibleKeys) => {
            for (let k of possibleKeys) {
              const foundKey = Object.keys(row).find(
                key => key.trim().toLowerCase().replace(/[\s()_-]/g, '') === k.toLowerCase().replace(/[\s()_-]/g, '')
              );
              if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
                return row[foundKey];
              }
            }
            return '';
          };

          return {
            id: index + 1,
            cmsIndex: getVal(['CMS Index', 'cmsIndex', 'STT']),
            name: getVal(['artist name', 'tên nghệ sĩ', 'name', 'artistName', 'Artist Name']) || 'Chưa cập nhật',
            englishName: getVal(['artist name (EN)', 'tên tiếng anh', 'englishName', 'artistNameEN', 'artist name(EN)']) || getVal(['artist name', 'tên nghệ sĩ']),
            type: getVal(['type', 'loại', 'phân loại']),
            artistClass: getVal(['artist class', 'lớp nghệ sĩ']),
            country: getVal(['country', 'quốc gia']) || 'Việt Nam',
            company: getVal(['entertainment', 'công ty', 'company', 'company name']) || 'Độc lập',
            workPhone: getVal(['SĐT liên hệ công việc', 'sdt', 'phone', 'workPhone', 'điện thoại']),
            workEmail: getVal(['email liên hệ công việc', 'email', 'workEmail']),
            managerNote: getVal(['ghi chú về Công Ty Quản Lý', 'note', 'ghi chú']),
            debutYear: getVal(['debut year', 'năm ra mắt', 'debut']),
            birthday: getVal(['birthday', 'ngày tháng năm sinh', 'sinh nhật']),
            bio: getVal(['artist information', 'thông tin giới thiệu nghệ sĩ', 'bio', 'giới thiệu']) || 'Chưa có thông tin giới thiệu.',
            instagram: getVal(['instagram', 'ig']),
            facebook: getVal(['facebook', 'fb']),
            twitter: getVal(['twitter', 'x']),
            tiktok: getVal(['tiktok']),
            youtube: getVal(['youtube', 'yt']),
            threads: getVal(['threads']),
            avatar: getVal(['avatar', 'ảnh', 'image']) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'
          };
        });
        setArtists(formattedData);
        const successCount = Object.values(resultMap).filter(r => r.ok).length;
        console.log(`✅ Đã tải ${formattedData.length} nghệ sĩ từ ${successCount}/${GOOGLE_SHEET_APIS.length} nguồn`);
        if (failed.length > 0) {
          console.warn(`❌ ${failed.length} nguồn fail:`, failed);
        }
      } else {
        setFetchError(true);
        console.error('❌ Không có dữ liệu nào từ tất cả các nguồn API');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Kết nối và tải đồng thời dữ liệu từ tất cả các Google Sheets Web App URLs
  useEffect(() => {
    fetchArtistsData();
  }, []);

  // Xử lý logic tìm kiếm
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || searchType === 'status') return [];
    const keyword = searchTerm.toLowerCase().trim();

    if (searchType === 'artist') {
      return artists.filter(item => {
        const name = typeof item.name === 'string' ? item.name.toLowerCase() : '';
        const englishName = typeof item.englishName === 'string' ? item.englishName.toLowerCase() : '';
        return name.includes(keyword) || englishName.includes(keyword);
      });
    } else {
      return artists.filter(item => {
        const company = typeof item.company === 'string' ? item.company.toLowerCase() : '';
        return company.includes(keyword);
      });
    }
  }, [searchTerm, searchType, artists]);

  // Gom nhóm theo công ty khi tìm kiếm theo công ty quản lý
  const groupedByCompany = useMemo(() => {
    if (searchType !== 'company' || !searchTerm.trim()) return {};
    const result = {};
    searchResults.forEach(art => {
      const compKey = art.company || 'Khác';
      if (!result[compKey]) {
        result[compKey] = [];
      }
      result[compKey].push(art);
    });
    return result;
  }, [searchType, searchResults, searchTerm]);

  const artistCompanyMap = useMemo(() => {
    const map = {};
    artists.forEach(a => {
      if (a?.name) map[a.name] = a.company || 'Độc lập';
    });
    return map;
  }, [artists]);

  // Lọc theo từ khóa + ca sĩ độc lập và sắp xếp thời gian trong tab Tình trạng liên hệ
  const filteredNotes = useMemo(() => {
    const kw = searchTerm.toLowerCase().trim();

    const filtered = contactNotes.filter(note => {
      if (onlyIndependentArtists) {
        const companyName = artistCompanyMap[note.artistName] ?? note.company ?? 'Độc lập';
        if (!isIndependentCompany(companyName)) return false;
      }

      if (kw) {
        const matchArtist = (note.artistName || '').toLowerCase().includes(kw);
        const matchPerson = (note.contactPerson || '').toLowerCase().includes(kw);
        const matchContent = (note.noteContent || '').toLowerCase().includes(kw);
        const matchChannel = (note.channelValue || '').toLowerCase().includes(kw);
        if (!matchArtist && !matchPerson && !matchContent && !matchChannel) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const timeA = parseNoteTimestamp(a);
      const timeB = parseNoteTimestamp(b);
      if (timeA !== timeB) {
        return statusTimeSort === 'newest' ? timeB - timeA : timeA - timeB;
      }
      const idA = Number(a?.id) || 0;
      const idB = Number(b?.id) || 0;
      return statusTimeSort === 'newest' ? idB - idA : idA - idB;
    });
  }, [contactNotes, searchTerm, onlyIndependentArtists, artistCompanyMap, statusTimeSort]);

  const selectedArtistNotes = useMemo(() => {
    if (!selectedItem) return [];
    return contactNotes.filter(n => n.artistName === selectedItem.name);
  }, [contactNotes, selectedItem]);

  // Tập hợp tên các nghệ sĩ đã có ghi chú (để đổi màu nền)
  // - Có ghi chú chưa authorize: nền vàng nhạt
  // - Có ghi chú đã authorize: nền xanh nhạt
  const artistsWithNotes = useMemo(() => {
    const map = {};
    contactNotes.forEach(note => {
      if (!note.artistName) return;
      if (!map[note.artistName]) {
        map[note.artistName] = { hasAny: false, hasAuthorized: false };
      }
      map[note.artistName].hasAny = true;
      if (note.isContacted) map[note.artistName].hasAuthorized = true;
    });
    return map;
  }, [contactNotes]);

  // Hàm xử lý lưu ghi chú mới từ popup chi tiết nghệ sĩ
  const handleSaveNote = async (e) => {
    e.preventDefault();
    try {
      const newNote = {
        artistName: selectedItem?.name || 'Chưa xác định',
        contactPerson: noteContactPerson,
        channel: noteChannel,
        channelValue: noteChannelValue,
        noteContent: noteContent,
        isContacted: false,
      };

      const created = await createArtistNote(newNote);
      setContactNotes(prev => [created.note, ...prev]);
      setShowNotePopup(false);
      // Reset form ghi chú
      setNoteContactPerson('');
      setNoteChannel('');
      setNoteChannelValue('');
      setNoteContent('');
    } catch (err) {
      alert('Lỗi khi lưu ghi chú: ' + err.message);
    }
  };

  // Hàm bật/tắt trạng thái "Đã liên hệ chưa"
  const toggleNoteContactStatus = async (id) => {
    const note = contactNotes.find(n => n.id === id);
    if (!note) return;
    try {
      const updated = await updateArtistNote(id, { isContacted: !note.isContacted });
      setContactNotes(prev =>
        prev.map(n => (n.id === id ? updated.note : n))
      );
    } catch (err) {
      alert('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  // Hàm xóa ghi chú
  const handleDeleteNote = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ghi chú liên hệ này không?')) {
      try {
        await deleteArtistNote(id);
        setContactNotes(prev => prev.filter(note => note.id !== id));
      } catch (err) {
        alert('Lỗi khi xóa ghi chú: ' + err.message);
      }
    }
  };

  // Hàm lưu cập nhật sau khi sửa ghi chú
  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!editingNote) return;
    try {
      const updated = await updateArtistNote(editingNote.id, {
        contactPerson: editingNote.contactPerson,
        channel: editingNote.channel,
        channelValue: editingNote.channelValue,
        noteContent: editingNote.noteContent,
        isContacted: editingNote.isContacted,
      });
      setContactNotes(prev =>
        prev.map(note => (note.id === editingNote.id ? updated.note : note))
      );
      setEditingNote(null);
    } catch (err) {
      alert('Lỗi khi cập nhật ghi chú: ' + err.message);
    }
  };

  return (
    <>
      {/* Page Header chuẩn CMS */}
      <div className="page-header">
        <div>
          <h1>TRA CỨU THÔNG TIN NGHỆ SĨ</h1>
          <p>Tìm kiếm và tra cứu thông tin các nghệ sĩ từ hệ thống Google Sheets</p>
        </div>
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={fetchArtistsData}
          disabled={isLoading}
          style={{ whiteSpace: 'nowrap', height: 'fit-content', alignSelf: 'center' }}
        >
          {isLoading ? '⏳ Đang tải...' : failedSources.length > 0 ? `🔄 Tải lại (${failedSources.length} fail)` : '🔄 Tải lại dữ liệu'}
        </button>
      </div>

      {fetchError && (
        <p className="login-error" style={{ marginBottom: '16px' }}>
          ⚠️ Đang hiển thị dữ liệu mẫu hoặc gặp sự cố kết nối một số nguồn Google Sheets API (qua proxy backend).
          {failedSources.length > 0 && (
            <><br />❌ {failedSources.length}/{GOOGLE_SHEET_APIS.length} nguồn không thể kết nối. Kiểm tra console (F12) để biết chi tiết.</>
          )}
        </p>
      )}

      {/* Thanh tab lựa chọn phương thức tìm kiếm & Tình trạng liên hệ */}
      <div className="filters-bar artist-filters" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          type="button"
          className={`btn ${searchType === 'artist' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setSearchType('artist'); setSearchTerm(''); }}
        >
          👤 Tìm theo Tên nghệ sĩ
        </button>
        <button 
          type="button"
          className={`btn ${searchType === 'company' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setSearchType('company'); setSearchTerm(''); }}
        >
          🏢 Tìm theo Công ty quản lý
        </button>
        <button 
          type="button"
          className={`btn ${searchType === 'status' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setSearchType('status'); setSearchTerm(''); }}
        >
          📋 Tình trạng liên hệ
          {contactNotes.length > 0 && (
            <span style={{
              background: searchType === 'status' ? 'rgba(255,255,255,0.25)' : 'var(--purple-bg)',
              color: searchType === 'status' ? '#fff' : 'var(--purple)',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              {contactNotes.length}
            </span>
          )}
        </button>
      </div>

      {/* Thanh tìm kiếm chính (ở tab Tình trạng liên hệ sẽ thu gọn 1 nửa và đặt cạnh bộ lọc thời gian + ca sĩ độc lập) */}
      <div
        className="filters-bar artist-filters"
        style={{
          position: 'relative',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <label
          className="filter-search"
          style={
            searchType === 'status'
              ? { flex: '1 1 320px', maxWidth: '50%', minWidth: '240px' }
              : { width: '100%' }
          }
        >
          <span className="filter-search-inner">
            <span style={{ fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              placeholder={
                searchType === 'artist'
                  ? "Nhập tên nghệ sĩ cần tìm..."
                  : searchType === 'company'
                  ? "Nhập tên công ty quản lý..."
                  : "Lọc nhanh theo nghệ sĩ, người liên hệ, nội dung..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </span>
        </label>

        {searchType === 'status' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 auto' }}>
            <label className="filter-select" style={{ margin: 0 }}>
              <span>🕒 Thời gian:</span>
              <select
                value={statusTimeSort}
                onChange={(e) => setStatusTimeSort(e.target.value)}
                aria-label="Sắp xếp theo thời gian"
              >
                <option value="newest">Mới nhất -&gt; Cũ nhất</option>
                <option value="oldest">Cũ nhất -&gt; Mới nhất</option>
              </select>
            </label>

            <button
              type="button"
              className={`btn ${onlyIndependentArtists ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setOnlyIndependentArtists(prev => !prev)}
              aria-pressed={onlyIndependentArtists}
            >
              🎤 Ca sĩ độc lập
            </button>
          </div>
        )}
      </div>

      {/* Khu vực hiển thị kết quả */}
      <div style={{ marginTop: '20px' }}>
        {searchType === 'status' ? (
          /* BẢNG TÌNH TRẠNG LIÊN HỆ (LỊCH SỬ GHI CHÚ) */
          <div className="table-wrapper">
            {notesLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>
                ⏳ Đang tải ghi chú...
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                    <th>NGHỆ SĨ</th>
                    <th style={{ width: '220px', maxWidth: '220px' }}>CÔNG TY QUẢN LÝ</th>
                    <th>NGƯỜI LIÊN HỆ</th>
                    <th style={{ minWidth: '280px' }}>NỘI DUNG GHI CHÚ</th>
                    <th style={{ textAlign: 'center', width: '180px' }}>TRẠNG THÁI ỦY QUYỀN</th>
                    <th style={{ textAlign: 'center', width: '140px' }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text)' }}>
                        {contactNotes.length === 0
                          ? 'Chưa có lịch sử ghi chú liên hệ nào. Hãy mở chi tiết nghệ sĩ và nhấn "Nhập ghi chú" để thêm mới.'
                          : onlyIndependentArtists && searchTerm.trim()
                          ? `Không tìm thấy ca sĩ độc lập nào khớp với từ khóa "${searchTerm}".`
                          : onlyIndependentArtists
                          ? 'Không có ghi chú liên hệ nào thuộc ca sĩ độc lập.'
                          : `Không tìm thấy ghi chú nào khớp với từ khóa "${searchTerm}".`}
                      </td>
                    </tr>
                  ) : (
                    filteredNotes.map((note, idx) => (
                      <tr key={note.id}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                        <td className="cell-strong">{note.artistName}</td>
                        <td style={{ maxWidth: '220px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.4 }}>{artistCompanyMap[note.artistName] || '—'}</td>
                        <td>{note.contactPerson}</td>
                        <td style={{ whiteSpace: 'normal', lineHeight: 1.5 }}>
                          <div style={{ marginBottom: '4px' }}>
                            <span className="type-badge" style={{ '--type-bg': 'var(--purple-bg)', '--type-border': 'var(--purple)', fontSize: '11px', padding: '2px 8px' }}>
                              {note.channel}: {note.channelValue}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text)', marginLeft: '8px' }}>
                              ({note.createdAt})
                            </span>
                          </div>
                          <div>{note.noteContent}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: note.isContacted ? 'var(--green-bg)' : 'var(--bg)',
                            border: `1px solid ${note.isContacted ? 'var(--green)' : 'var(--border)'}`,
                            color: note.isContacted ? 'var(--green)' : 'var(--text)',
                            fontWeight: 600,
                            fontSize: '12px',
                            userSelect: 'none'
                          }}>
                            <input
                              type="checkbox"
                              checked={note.isContacted}
                              onChange={() => toggleNoteContactStatus(note.id)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--green)' }}
                            />
                            {note.isContacted ? 'Đã ủy quyền' : 'Chưa ủy quyền'}
                          </label>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="icon-btn table-icon-btn"
                              title="Sửa ghi chú"
                              onClick={() => setEditingNote({ ...note })}
                              style={{ color: 'var(--blue)' }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="icon-btn table-icon-btn unit-delete-btn"
                              title="Xóa ghi chú"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        ) : isLoading ? (
          <div className="table-wrapper" style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>
            Đang đồng bộ dữ liệu từ Google Sheets...
          </div>
        ) : !searchTerm.trim() ? (
          <div className="table-wrapper" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✨</div>
            <h3 style={{ fontSize: '16px', color: 'var(--text-h)', marginBottom: '6px' }}>Hệ thống sẵn sàng tra cứu</h3>
            <p style={{ fontSize: '13px', color: 'var(--text)' }}>Chọn phương thức tìm kiếm phía trên và nhập từ khóa để xem thông tin chi tiết các cột dữ liệu nghệ sĩ.</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="table-wrapper" style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>
            Không tìm thấy dữ liệu phù hợp với từ khóa <strong>"{searchTerm}"</strong>.
          </div>
        ) : searchType === 'artist' ? (
          <div className="artists-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {searchResults.map(artist => (
              <div 
                className="stat-card" 
                key={artist.id} 
                onClick={() => setSelectedItem(artist)}
                style={{ background: artistsWithNotes[artist.name]?.hasAuthorized ? 'var(--green-bg)' : artistsWithNotes[artist.name]?.hasAny ? 'var(--yellow-bg)' : 'var(--panel)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', cursor: 'pointer', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={artist.avatar} alt={artist.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-h)', margin: 0 }}>{artist.name}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text)' }}>🏢 {artist.company}</span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {artist.bio}
                </p>
                <span style={{ fontSize: '12px', color: 'var(--purple)', fontWeight: 600, marginTop: 'auto' }}>Xem chi tiết các cột thông tin →</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.keys(groupedByCompany).map(compName => (
              <div key={compName} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--text-h)', margin: 0 }}>🏢 {compName}</h3>
                  <span className="type-badge" style={{ '--type-bg': 'var(--purple-bg)', '--type-border': 'var(--purple)' }}>
                    {groupedByCompany[compName].length} Nghệ sĩ trực thuộc
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  {groupedByCompany[compName].map(artist => (
                    <div 
                      key={artist.id} 
                      onClick={() => setSelectedItem(artist)}
                      style={{ background: artistsWithNotes[artist.name]?.hasAuthorized ? 'var(--green-bg)' : artistsWithNotes[artist.name]?.hasAny ? 'var(--yellow-bg)' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}
                    >
                      <img src={artist.avatar} alt={artist.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-h)', margin: '0 0 2px 0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{artist.name}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text)' }}>🇻🇳 {artist.country} {artist.debutYear ? `• ${artist.debutYear}` : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal chi tiết nghệ sĩ & Popup nhập ghi chú bên cạnh */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => { setSelectedItem(null); setShowNotePopup(false); }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', maxWidth: showNotePopup ? '1080px' : '600px', width: '100%', transition: 'max-width 0.3s ease' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Chi tiết Nghệ Sĩ chính */}
            <div className="modal-card" style={{ flex: '1', maxWidth: '600px', margin: 0 }}>
              <div className="modal-header">
                <h2>Chi Tiết Thông Tin Nghệ Sĩ</h2>
                <button type="button" className="icon-btn table-icon-btn" onClick={() => { setSelectedItem(null); setShowNotePopup(false); }}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '10px' }}>
                <img src={selectedItem.avatar} alt={selectedItem.name} style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-h)', margin: '0 0 4px 0' }}>
                    {selectedItem.name} <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 'normal' }}>({selectedItem.englishName})</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text)', margin: '0 0 4px 0' }}>🏢 Công ty: <strong>{selectedItem.company}</strong></p>
                  <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                    🏷️ Loại: {selectedItem.type} • 🌍 Quốc gia: {selectedItem.country}
                    {selectedItem.debutYear ? ` • 📅 Debut: ${selectedItem.debutYear}` : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-h)', display: 'block', marginBottom: '4px' }}>📄 Thông tin giới thiệu (Bio):</strong>
                  <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>{selectedItem.bio}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--text-h)', display: 'block', marginBottom: '2px' }}>📞 SĐT liên hệ công việc:</strong>
                    <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>{selectedItem.workPhone || 'Chưa cập nhật'}</p>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--text-h)', display: 'block', marginBottom: '2px' }}>✉️ Email công việc:</strong>
                    <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, wordBreak: 'break-all' }}>{selectedItem.workEmail || selectedItem.managerNote || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-h)', display: 'block', marginBottom: '8px' }}>🌐 Mạng xã hội & Kênh truyền thông:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedItem.facebook && <a href={selectedItem.facebook} target="_blank" rel="noreferrer" className="type-badge" style={{ textDecoration: 'none' }}>📘 Facebook</a>}
                    {selectedItem.instagram && <a href={selectedItem.instagram} target="_blank" rel="noreferrer" className="type-badge" style={{ textDecoration: 'none' }}>📷 Instagram</a>}
                    {selectedItem.twitter && <a href={selectedItem.twitter} target="_blank" rel="noreferrer" className="type-badge" style={{ textDecoration: 'none' }}>🐦 Twitter / X</a>}
                    {selectedItem.tiktok && <a href={selectedItem.tiktok} target="_blank" rel="noreferrer" className="type-badge" style={{ textDecoration: 'none' }}>🎵 TikTok</a>}
                    {selectedItem.youtube && <a href={selectedItem.youtube} target="_blank" rel="noreferrer" className="type-badge" style={{ textDecoration: 'none' }}>▶️ YouTube</a>}
                    {selectedItem.threads && <a href={selectedItem.threads} target="_blank" rel="noreferrer" className="type-badge" style={{ textDecoration: 'none' }}>🧵 Threads</a>}
                    {!selectedItem.facebook && !selectedItem.instagram && !selectedItem.twitter && !selectedItem.tiktok && !selectedItem.youtube && !selectedItem.threads && (
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>Chưa cập nhật liên kết mạng xã hội.</span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-h)', display: 'block', marginBottom: '8px' }}>📝 Ghi chú đã lưu ({selectedArtistNotes.length}):</strong>
                  {selectedArtistNotes.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>Chưa có ghi chú cho nghệ sĩ này.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                      {selectedArtistNotes.map(note => (
                        <div key={note.id} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span className="type-badge" style={{ '--type-bg': 'var(--purple-bg)', '--type-border': 'var(--purple)', fontSize: '11px', padding: '2px 8px' }}>
                              {note.channel}: {note.channelValue}
                            </span>
                            <span style={{ fontSize: '11px', color: note.isContacted ? 'var(--green)' : 'var(--text)', fontWeight: 600 }}>
                              {note.isContacted ? 'Đã ủy quyền' : 'Chưa ủy quyền'}{note.createdAt ? ` • ${note.createdAt}` : ''}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-h)', marginBottom: '4px' }}><strong>Người liên hệ:</strong> {note.contactPerson}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{note.noteContent}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Các nút hành động phía dưới modal chi tiết */}
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className={`btn ${showNotePopup ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setShowNotePopup(!showNotePopup)}
                >
                  📝 {showNotePopup ? 'Đang mở Nhập ghi chú' : 'Nhập ghi chú'}
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => { setSelectedItem(null); setShowNotePopup(false); }}>Đóng</button>
                </div>
              </div>
            </div>

            {/* Popup Nhập Ghi Chú hiện ra bên cạnh */}
            {showNotePopup && (
              <div className="modal-card" style={{ flex: '1', maxWidth: '460px', margin: 0, animation: 'fadeIn 0.2s ease' }}>
                <div className="modal-header">
                  <h2>Nhập Ghi Chú</h2>
                  <button type="button" className="icon-btn table-icon-btn" onClick={() => setShowNotePopup(false)}>✕</button>
                </div>

                <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                  {/* 1. Người liên hệ */}
                  <div className="login-field">
                    <label>1. Người liên hệ:</label>
                    <select 
                      value={noteContactPerson} 
                      onChange={(e) => setNoteContactPerson(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn nhân viên hệ thống --</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.name}>{staff.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Kênh liên hệ */}
                  <div className="login-field">
                    <label>2. Kênh liên hệ:</label>
                    <select 
                      value={noteChannel} 
                      onChange={(e) => {
                        setNoteChannel(e.target.value);
                        setNoteChannelValue('');
                      }}
                      required
                    >
                      <option value="">-- Chọn kênh liên hệ --</option>
                      <option value="Zalo">Zalo</option>
                      <option value="Messenger">Messenger</option>
                      <option value="Email">Email</option>
                      <option value="Số điện thoại">Số điện thoại</option>
                    </select>
                  </div>

                  {/* Khi chọn kênh xong sẽ hiện ô input tương ứng */}
                  {noteChannel && (
                    <div className="login-field" style={{ animation: 'fadeIn 0.2s ease' }}>
                      <label>Nhập thông tin ({noteChannel}):</label>
                      <input 
                        type={noteChannel === 'Email' ? 'email' : noteChannel === 'Số điện thoại' ? 'tel' : 'text'}
                        placeholder={`Nhập ${noteChannel.toLowerCase()} liên hệ...`}
                        value={noteChannelValue}
                        onChange={(e) => setNoteChannelValue(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* 3. Ghi chú (cho nhập dài, nhiều ký tự) */}
                  <div className="login-field">
                    <label>3. Ghi chú:</label>
                    <textarea 
                      rows="4"
                      placeholder="Nhập nội dung ghi chú chi tiết..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      style={{ 
                        border: '1px solid var(--border)', 
                        borderRadius: '10px', 
                        padding: '10px 14px', 
                        fontSize: '14px', 
                        background: 'var(--bg)', 
                        color: 'var(--text-h)', 
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                      required
                    />
                  </div>

                  <div className="modal-actions" style={{ marginTop: '8px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowNotePopup(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary">Lưu Ghi Chú</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal Sửa Ghi Chú (từ tab Tình trạng liên hệ) */}
      {editingNote && (
        <div className="modal-overlay" onClick={() => setEditingNote(null)}>
          <div className="modal-card" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sửa Ghi Chú Liên Hệ</h2>
              <button type="button" className="icon-btn table-icon-btn" onClick={() => setEditingNote(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
              <div className="login-field">
                <label>Nghệ sĩ:</label>
                <input type="text" value={editingNote.artistName} disabled style={{ opacity: 0.7 }} />
              </div>

              <div className="login-field">
                <label>Người liên hệ:</label>
                <select
                  value={editingNote.contactPerson}
                  onChange={(e) => setEditingNote({ ...editingNote, contactPerson: e.target.value })}
                  required
                >
                  <option value="">-- Chọn nhân viên hệ thống --</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.name}>{staff.name}</option>
                  ))}
                </select>
              </div>

              <div className="login-field">
                <label>Kênh liên hệ:</label>
                <select
                  value={editingNote.channel}
                  onChange={(e) => setEditingNote({ ...editingNote, channel: e.target.value })}
                  required
                >
                  <option value="Zalo">Zalo</option>
                  <option value="Messenger">Messenger</option>
                  <option value="Email">Email</option>
                  <option value="Số điện thoại">Số điện thoại</option>
                </select>
              </div>

              <div className="login-field">
                <label>Thông tin ({editingNote.channel}):</label>
                <input
                  type="text"
                  value={editingNote.channelValue}
                  onChange={(e) => setEditingNote({ ...editingNote, channelValue: e.target.value })}
                  required
                />
              </div>

              <div className="login-field">
                <label>Nội dung ghi chú:</label>
                <textarea
                  rows="4"
                  value={editingNote.noteContent}
                  onChange={(e) => setEditingNote({ ...editingNote, noteContent: e.target.value })}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '14px',
                    background: 'var(--bg)',
                    color: 'var(--text-h)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={editingNote.isContacted}
                  onChange={(e) => setEditingNote({ ...editingNote, isContacted: e.target.checked })}
                />
                <span>Đã ủy quyền</span>
              </label>

              <div className="modal-actions" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingNote(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}