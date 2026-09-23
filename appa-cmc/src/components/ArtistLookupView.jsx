import { useState, useMemo, useEffect } from 'react'

// Cấu hình Link Google Sheets (Web App URL)
const GOOGLE_SHEET_API = 'https://script.google.com/macros/s/AKfycbxEBA4qRAW7gUMDmz8IoJwM7E7VsxTYXiTA9gAl0J9SfzgAoUt2SJRww2_7eMysb9-xCg/exec'; 

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

export default function ArtistLookupView() {
  const [searchType, setSearchType] = useState('artist'); // 'artist' hoặc 'company'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [artists, setArtists] = useState(FALLBACK_ARTISTS);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Kết nối và tải dữ liệu từ Google Sheets khi khởi chạy
  useEffect(() => {
    if (!GOOGLE_SHEET_API.includes('YOUR_APPS_SCRIPT_ID')) {
      setIsLoading(true);
      fetch(GOOGLE_SHEET_API)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const formattedData = data.map((row, index) => {
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
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Không thể kết nối Google Sheets API, sử dụng dữ liệu mẫu:', err);
          setFetchError(true);
          setIsLoading(false);
        });
    }
  }, []);

  // Xử lý logic tìm kiếm
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const keyword = searchTerm.toLowerCase().trim();

    if (searchType === 'artist') {
      return artists.filter(item => 
        item.name.toLowerCase().includes(keyword) || 
        (item.englishName && item.englishName.toLowerCase().includes(keyword))
      );
    } else {
      return artists.filter(item => 
        item.company.toLowerCase().includes(keyword) || 
        (item.managerNote && item.managerNote.toLowerCase().includes(keyword))
      );
    }
  }, [searchTerm, searchType, artists]);

  // Gợi ý thông minh khi nhập liệu
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const keyword = searchTerm.toLowerCase().trim();
    if (searchType === 'artist') {
      return artists
        .filter(item => item.name.toLowerCase().includes(keyword))
        .map(i => i.name)
        .slice(0, 5);
    } else {
      const comps = [...new Set(artists.map(i => i.company).filter(Boolean))];
      return comps.filter(c => c.toLowerCase().includes(keyword)).slice(0, 5);
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

  return (
    <>
      {/* Page Header chuẩn CMS */}
      <div className="page-header">
        <div>
          <h1>TRA CỨU THÔNG TIN NGHỆ SĨ</h1>
          <p>Tìm kiếm và tra cứu thông tin các nghệ sĩ trong hệ thống trích xuất từ Google Sheets</p>
        </div>
      </div>

      {fetchError && (
        <p className="login-error" style={{ marginBottom: '16px' }}>
          ⚠️ Đang hiển thị dữ liệu mẫu (Chưa cấu hình Google Apps Script Web App URL).
        </p>
      )}

      {/* Thanh tab lựa chọn phương thức tìm kiếm */}
      <div className="filters-bar artist-filters" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
      </div>

      {/* Thanh tìm kiếm chính */}
      <div className="filters-bar artist-filters" style={{ position: 'relative' }}>
        <label className="filter-search" style={{ width: '100%' }}>
          <span className="filter-search-inner">
            <span style={{ fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              placeholder={searchType === 'artist' ? "Nhập tên nghệ sĩ cần tìm..." : "Nhập tên công ty quản lý..."}
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

        {/* Gợi ý nhanh dạng dropdown */}
        {suggestions.length > 0 && searchTerm && (
          <div className="suggestions-dropdown" style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow)',
            zIndex: 20,
            overflow: 'hidden'
          }}>
            {suggestions.map((sug, idx) => (
              <div 
                key={idx} 
                className="suggestion-item"
                onClick={() => setSearchTerm(sug)}
                style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)' }}
              >
                <span>{searchType === 'artist' ? '🎤' : '🏢'}</span> {sug}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Khu vực hiển thị kết quả */}
      <div style={{ marginTop: '20px' }}>
        {isLoading ? (
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
                style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', cursor: 'pointer', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '3px solid var(--purple)' }}
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
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}
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

      {/* Modal chi tiết nghệ sĩ */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Chi Tiết Thông Tin Nghệ Sĩ</h2>
              <button type="button" className="icon-btn table-icon-btn" onClick={() => setSelectedItem(null)}>✕</button>
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
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setSelectedItem(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}