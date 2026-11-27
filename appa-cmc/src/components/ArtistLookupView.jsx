import { useState, useMemo, useEffect, useRef } from 'react'
import { GOOGLE_SHEET_APIS, PROXY_BATCH_URL, PROXY_CONFIG } from '../data/googleSheetConfig'
import { fetchArtistNotes, createArtistNote, updateArtistNote, deleteArtistNote, fetchStaff } from '../api'
import * as XLSX from 'xlsx'

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

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function toDateKey(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateKeyVN(dateKey) {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-');
  return `${d}/${m}/${y}`;
}

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

function getNoteDateKey(note) {
  if (!note?.createdAt) return '';
  const raw = String(note.createdAt).trim();

  // Định dạng DD/MM/YYYY hoặc DD-MM-YYYY ở đầu chuỗi
  const vnMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (vnMatch) {
    const [, day, month, year] = vnMatch;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Định dạng ISO YYYY-MM-DD...
  const direct = Date.parse(raw);
  if (!Number.isNaN(direct)) {
    return toDateKey(new Date(direct));
  }
  return '';
}

function formatNoteDateTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';

  let ms = Date.parse(raw);
  if (Number.isNaN(ms)) {
    const match = raw.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
    );
    if (match) {
      const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
      ms = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      ).getTime();
    }
  }
  if (Number.isNaN(ms)) return raw;

  const date = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

export default function ArtistLookupView({ canEdit = false, detailId = null, detailData = null }) {
  const [searchType, setSearchType] = useState('artist'); // 'artist' | 'company' | 'status'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTimeSort, setStatusTimeSort] = useState('newest'); // 'newest' | 'oldest'
  const [onlyIndependentArtists, setOnlyIndependentArtists] = useState(false);
  const [authStatusFilter, setAuthStatusFilter] = useState('all'); // 'all' | 'authorized' | 'unauthorized'
  const [staffFilter, setStaffFilter] = useState('all');
  const [difficultFilter, setDifficultFilter] = useState('all'); // 'all' | 'yes' | 'no'
  const [difficultIds, setDifficultIds] = useState(new Set());

  // State bộ lọc ngày tháng năm (chọn 1 ngày hoặc khoảng 2 ngày)
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const datePickerRef = useRef(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [artists, setArtists] = useState(FALLBACK_ARTISTS);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [failedSources, setFailedSources] = useState([]);

  // Auto-open detail view when detailId is provided
  useEffect(() => {
    if (detailId && artists.length > 0) {
      const artist = artists.find(a => a.id === detailId || a.cmsIndex === detailId)
      if (artist) {
        setSelectedItem(artist)
      }
    } else if (detailData) {
      setSelectedItem(detailData)
    }
  }, [detailId, detailData, artists.length])

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

  // Đóng dropdown lịch khi click ra ngoài
  useEffect(() => {
    if (!showDatePicker) return;
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

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

  // Xử lý chọn ngày trên lịch:
  // - Lần 1: chọn 1 ngày (start = dayKey, end = '')
  // - Lần 2: chọn thêm ngày thứ 2 -> tạo khoảng [start, end]
  // - Lần 3: bắt đầu chọn lại từ đầu với ngày mới
  const handleSelectCalendarDay = (dayKey) => {
    setDateRange(prev => {
      if (!prev.start || (prev.start && prev.end)) {
        return { start: dayKey, end: '' };
      }
      if (dayKey === prev.start) {
        return { start: dayKey, end: '' };
      }
      if (dayKey < prev.start) {
        return { start: dayKey, end: prev.start };
      }
      return { start: prev.start, end: dayKey };
    });
  };

  // Tạo lưới 42 ô ngày cho tháng đang hiển thị (bắt đầu từ Thứ 2)
  const todayKey = toDateKey(new Date()); 
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // T2 = 0 ... CN = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({ date: d, key: toDateKey(d), inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({ date: d, key: toDateKey(d), inMonth: true });
    }
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      cells.push({ date: d, key: toDateKey(d), inMonth: false });
    }
    return cells;
  }, [calendarMonth]);

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

          let company = getVal(['entertainment', 'công ty', 'company', 'company name']) || 'Độc lập';
          let workPhone = getVal(['SĐT liên hệ công việc', 'sdt', 'phone', 'workPhone', 'điện thoại']);

          // Kiểm tra và hoán đổi nếu công ty lại nằm ở cột SĐT (dữ liệu sai vị trí)
          const phonePattern = /^[\d\s\+\-\(\)]{7,20}$/;
          if (workPhone && !phonePattern.test(String(workPhone).trim()) && phonePattern.test(String(company).trim())) {
            const temp = company;
            company = workPhone;
            workPhone = temp;
          }

          return {
            id: index + 1,
            cmsIndex: getVal(['CMS Index', 'cmsIndex', 'STT']),
            name: getVal(['artist name', 'tên nghệ sĩ', 'name', 'artistName', 'Artist Name']) || 'Chưa cập nhật',
            englishName: getVal(['artist name (EN)', 'tên tiếng anh', 'englishName', 'artistNameEN', 'artist name(EN)']) || getVal(['artist name', 'tên nghệ sĩ']),
            type: getVal(['type', 'loại', 'phân loại']),
            artistClass: getVal(['artist class', 'lớp nghệ sĩ']),
            country: getVal(['country', 'quốc gia']) || 'Việt Nam',
            company: company,
            workPhone: workPhone,
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

  // Lọc theo từ khóa + ca sĩ độc lập + ngày/khoảng ngày + trạng thái ủy quyền và sắp xếp thời gian trong tab Tình trạng liên hệ
  const filteredNotes = useMemo(() => {
    const kw = searchTerm.toLowerCase().trim();

    const filtered = contactNotes.filter(note => {
      if (onlyIndependentArtists) {
        const companyName = artistCompanyMap[note.artistName] ?? note.company ?? 'Độc lập';
        if (!isIndependentCompany(companyName)) return false;
      }

      if (authStatusFilter === 'authorized' && !note.isContacted) return false;
      if (authStatusFilter === 'unauthorized' && note.isContacted) return false;

      if (staffFilter !== 'all' && (note.contactPerson || '') !== staffFilter) return false;
      if (difficultFilter === 'yes' && !difficultIds.has(note.id)) return false;
      if (difficultFilter === 'no' && difficultIds.has(note.id)) return false;

      if (dateRange.start) {
        const noteDay = getNoteDateKey(note);
        if (!noteDay) return false;
        if (dateRange.end) {
          if (noteDay < dateRange.start || noteDay > dateRange.end) return false;
        } else {
          if (noteDay !== dateRange.start) return false;
        }
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
  }, [contactNotes, searchTerm, onlyIndependentArtists, authStatusFilter, artistCompanyMap, statusTimeSort, dateRange, staffFilter, difficultFilter, difficultIds]);

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

  const toggleNoteDifficult = (id) => {
    setDifficultIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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

  const exportNotesCSV = () => {
    const rows = filteredNotes.map((n, i) => [
      i + 1,
      n.artistName,
      artistCompanyMap[n.artistName] || '',
      n.contactPerson,
      formatNoteDateTime(n.createdAt),
      n.channel ? `${n.channel}: ${n.channelValue}` : '',
      n.noteContent || '',
      n.isContacted ? 'Đã ủy quyền' : 'Chưa ủy quyền',
      difficultIds.has(n.id) ? 'Có' : 'Không',
    ]);
    const header = ['STT','Nghệ sĩ','Công ty quản lý','Người liên hệ','Ngày giờ ghi chú','Kênh','Nội dung','Trạng thái ủy quyền','Khó'];
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tinh trang lien he');
    XLSX.writeFile(wb, 'tinh_trang_lien_he.xlsx');
  };

  const dateFilterLabel = !dateRange.start
    ? 'Ngày tháng năm'
    : dateRange.end
    ? `${formatDateKeyVN(dateRange.start)} → ${formatDateKeyVN(dateRange.end)}`
    : formatDateKeyVN(dateRange.start);

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

      {/* Thanh tìm kiếm chính (ở tab Tình trạng liên hệ sẽ thu gọn và đặt cạnh các bộ lọc) */}
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
              ? { flex: '1 1 280px', maxWidth: '42%', minWidth: '220px' }
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

            {/* Bộ lọc Ngày tháng năm xổ xuống lịch chọn 1 ngày hoặc 2 ngày */}
            <div ref={datePickerRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <button
                type="button"
                className={`btn ${dateRange.start ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setShowDatePicker(prev => !prev)}
                aria-expanded={showDatePicker}
                title="Chọn 1 ngày hoặc 2 ngày để lọc theo khoảng thời gian"
              >
                <span>📅 {dateFilterLabel}</span>
                {dateRange.start && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateRange({ start: '', end: '' });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setDateRange({ start: '', end: '' });
                      }
                    }}
                    title="Xóa lọc ngày"
                    style={{
                      marginLeft: '4px',
                      padding: '0 4px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      opacity: 0.9
                    }}
                  >
                    ✕
                  </span>
                )}
              </button>

              {showDatePicker && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '300px',
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.15)',
                    padding: '14px',
                    zIndex: 60
                  }}
                >
                  {/* Thanh điều hướng tháng / năm */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <button
                      type="button"
                      className="icon-btn table-icon-btn"
                      onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      title="Tháng trước"
                    >
                      ‹
                    </button>
                    <strong style={{ fontSize: '14px', color: 'var(--text-h)' }}>
                      Tháng {calendarMonth.getMonth() + 1} / {calendarMonth.getFullYear()}
                    </strong>
                    <button
                      type="button"
                      className="icon-btn table-icon-btn"
                      onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      title="Tháng sau"
                    >
                      ›
                    </button>
                  </div>

                  {/* Hàng tiêu đề thứ trong tuần */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '4px' }}>
                    {WEEKDAY_LABELS.map(dayLabel => (
                      <span key={dayLabel} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', padding: '4px 0' }}>
                        {dayLabel}
                      </span>
                    ))}
                  </div>

                  {/* Lưới các ngày trong tháng */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                    {calendarDays.map(cell => {
                      const isStart = dateRange.start === cell.key;
                      const isEnd = dateRange.end === cell.key;
                      const isSelectedEdge = isStart || isEnd;
                      const isInRange = Boolean(
                        dateRange.start &&
                        dateRange.end &&
                        cell.key > dateRange.start &&
                        cell.key < dateRange.end
                      );
                      const isToday = cell.key === todayKey;

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          onClick={() => handleSelectCalendarDay(cell.key)}
                          style={{
                            height: '34px',
                            border: isToday && !isSelectedEdge ? '1px solid var(--purple)' : '1px solid transparent',
                            borderRadius: isSelectedEdge ? '8px' : isInRange ? '4px' : '8px',
                            background: isSelectedEdge
                              ? 'var(--purple)'
                              : isInRange
                              ? 'var(--purple-bg)'
                              : 'transparent',
                            color: isSelectedEdge
                              ? '#fff'
                              : isInRange
                              ? 'var(--purple)'
                              : cell.inMonth
                              ? 'var(--text-h)'
                              : 'var(--text)',
                            opacity: cell.inMonth || isSelectedEdge || isInRange ? 1 : 0.45,
                            fontWeight: isSelectedEdge || isToday ? 700 : 500,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {cell.date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Hướng dẫn chọn + nút thao tác nhanh */}
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '11px',
                    color: 'var(--text)'
                  }}>
                    <span>
                      {!dateRange.start
                        ? 'Chọn 1 ngày hoặc 2 ngày'
                        : !dateRange.end
                        ? `Đang lọc: ${formatDateKeyVN(dateRange.start)}`
                        : `${formatDateKeyVN(dateRange.start)} - ${formatDateKeyVN(dateRange.end)}`}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const key = toDateKey(now);
                          setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                          setDateRange({ start: key, end: '' });
                        }}
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text-h)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Hôm nay
                      </button>
                      {dateRange.start && (
                        <button
                          type="button"
                          onClick={() => setDateRange({ start: '', end: '' })}
                          style={{
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--red)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bộ lọc Trạng thái ủy quyền */}
            <label className="filter-select" style={{ margin: 0 }}>
              <span>✅ Trạng thái:</span>
              <select
                value={authStatusFilter}
                onChange={(e) => setAuthStatusFilter(e.target.value)}
                aria-label="Lọc theo trạng thái ủy quyền"
                style={{ minWidth: '125px' }}
              >
                <option value="all">Tất cả</option>
                <option value="authorized">Đã ủy quyền</option>
                <option value="unauthorized">Chưa ủy quyền</option>
              </select>
            </label>

            {/* Bộ lọc Nhân viên liên hệ */}
            <label className="filter-select" style={{ margin: 0 }}>
              <span>👤 :</span>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                aria-label="Lọc theo người liên hệ"
                style={{ minWidth: '140px' }}
              >
                <option value="all">Tất cả</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </label>

            {/* Bộ lọc Khó */}
            <label className="filter-select" style={{ margin: 0 }}>
              <span>⚠️ Khó:</span>
              <select
                value={difficultFilter}
                onChange={(e) => setDifficultFilter(e.target.value)}
                aria-label="Lọc theo trạng thái khó"
                style={{ minWidth: '100px' }}
              >
                <option value="all">Tất cả</option>
                <option value="yes">Có</option>
                <option value="no">Không</option>
              </select>
            </label>

            <button type="button" className="btn btn-outline" onClick={exportNotesCSV}>
              ⬇️ Tải Excel
            </button>
          </div>
        )}
      </div>

      {/* Dòng tóm tắt kết quả sau khi lọc */}
      {(searchType === 'status' || searchTerm.trim()) && (
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text)' }}>
          {searchType === 'status' ? (
            <>
              📊 Hiển thị <strong style={{ color: 'var(--text-h)' }}>{filteredNotes.length}</strong> / {contactNotes.length} ghi chú liên hệ
              {dateRange.start ? ' • Đang lọc theo ngày' : ''}
              {onlyIndependentArtists ? ' • Ca sĩ độc lập' : ''}
              {authStatusFilter === 'authorized'
                ? ' • Đã ủy quyền'
                : authStatusFilter === 'unauthorized'
                ? ' • Chưa ủy quyền'
                : ''}
              {searchTerm.trim() ? ` • Từ khóa "${searchTerm.trim()}"` : ''}
            </>
          ) : (
            <>
              🔎 Tìm thấy <strong style={{ color: 'var(--text-h)' }}>{searchResults.length}</strong> nghệ sĩ
              {searchType === 'company' && searchResults.length > 0
                ? ` tại ${Object.keys(groupedByCompany).length} công ty`
                : ''}{' '}
              khớp với từ khóa "{searchTerm.trim()}"
            </>
          )}
        </div>
      )}

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
                    <th style={{ minWidth: '180px' }}>NGÀY GIỜ GHI CHÚ</th>
                    <th style={{ textAlign: 'center', width: '180px' }}>TRẠNG THÁI ỦY QUYỀN</th>
                    <th style={{ textAlign: 'center', width: '80px' }}>Khó</th>
                    <th style={{ textAlign: 'center', width: '140px' }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text)' }}>
                        {contactNotes.length === 0
                          ? 'Chưa có lịch sử ghi chú liên hệ nào. Hãy mở chi tiết nghệ sĩ và nhấn "Nhập ghi chú" để thêm mới.'
                          : authStatusFilter !== 'all'
                          ? `Không có ghi chú liên hệ nào ở trạng thái "${authStatusFilter === 'authorized' ? 'Đã ủy quyền' : 'Chưa ủy quyền'}" phù hợp với bộ lọc hiện tại.`
                          : dateRange.start
                          ? `Không có ghi chú liên hệ nào trong ${dateRange.end ? `khoảng từ ${formatDateKeyVN(dateRange.start)} đến ${formatDateKeyVN(dateRange.end)}` : `ngày ${formatDateKeyVN(dateRange.start)}`}.`
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
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                            {formatNoteDateTime(note.createdAt)}
                            {note.updatedAt && note.updatedAt !== note.createdAt && (
                              <span style={{ marginLeft: '8px', fontWeight: 400, fontSize: '12px', color: 'var(--text)' }}>
                                (Cập nhật: {formatNoteDateTime(note.updatedAt)})
                              </span>
                            )}
                          </div>
                          {note.channel && (
                            <div style={{ marginBottom: '4px' }}>
                              <span className="type-badge" style={{ '--type-bg': 'var(--purple-bg)', '--type-border': 'var(--purple)', fontSize: '11px', padding: '2px 8px' }}>
                                {note.channel}: {note.channelValue}
                              </span>
                            </div>
                          )}
                          {note.noteContent && <div style={{ fontSize: '13px', color: 'var(--text-h)' }}>{note.noteContent}</div>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: canEdit ? 'pointer' : 'default',
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
                              disabled={!canEdit}
                              onChange={() => toggleNoteContactStatus(note.id)}
                              style={{ width: '16px', height: '16px', cursor: canEdit ? 'pointer' : 'default', accentColor: 'var(--green)' }}
                            />
                            {note.isContacted ? 'Đã ủy quyền' : 'Chưa ủy quyền'}
                          </label>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={difficultIds.has(note.id)}
                            disabled={!canEdit}
                            onChange={() => toggleNoteDifficult(note.id)}
                            style={{ width: '16px', height: '16px', cursor: canEdit ? 'pointer' : 'default', accentColor: 'var(--red)' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {canEdit && (
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
                          )}
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
                              {note.isContacted ? 'Đã ủy quyền' : 'Chưa ủy quyền'}{note.createdAt ? ` • ${formatNoteDateTime(note.createdAt)}` : ''}
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
                {canEdit ? (
                  <button 
                    type="button" 
                    className={`btn ${showNotePopup ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setShowNotePopup(!showNotePopup)}
                  >
                    📝 {showNotePopup ? 'Đang mở Nhập ghi chú' : 'Nhập ghi chú'}
                  </button>
                ) : (
                  <span />
                )}
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
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  {/* Khi chọn kênh xong sẽ hiện ô input tương ứng */}
                  {noteChannel && (
                    <div className="login-field" style={{ animation: 'fadeIn 0.2s ease' }}>
                      <label>Nhập thông tin ({noteChannel}):</label>
                      <input 
                        type={noteChannel === 'Email' ? 'email' : noteChannel === 'Số điện thoại' ? 'tel' : 'text'}
                        placeholder={`Nhập ${noteChannel === 'Khác' ? 'thông tin' : noteChannel.toLowerCase()} liên hệ...`}
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
                <label>:</label>
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
                  <option value="Khác">Khác</option>
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