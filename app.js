
const YOUTUBE_CATEGORIES = [
  { id: "1", title: "Film & Animation", vi: "Phim & Hoạt hình" },
  { id: "2", title: "Autos & Vehicles", vi: "Ô tô & Phương tiện" },
  { id: "10", title: "Music", vi: "Âm nhạc" },
  { id: "15", title: "Pets & Animals", vi: "Thú cưng & Động vật" },
  { id: "17", title: "Sports", vi: "Thể thao" },
  { id: "19", title: "Travel & Events", vi: "Du lịch & Sự kiện" },
  { id: "20", title: "Gaming", vi: "Trò chơi" },
  { id: "22", title: "People & Blogs", vi: "Con người & Blog" },
  { id: "23", title: "Comedy", vi: "Hài" },
  { id: "24", title: "Entertainment", vi: "Giải trí" },
  { id: "25", title: "News & Politics", vi: "Tin tức & Chính trị" },
  { id: "26", title: "Howto & Style", vi: "Hướng dẫn & Phong cách" },
  { id: "27", title: "Education", vi: "Giáo dục" },
  { id: "28", title: "Science & Technology", vi: "Khoa học & Công nghệ" },
  { id: "29", title: "Nonprofits & Activism", vi: "Phi lợi nhuận & Hoạt động xã hội" }
];

const STORAGE_KEYS = {
  packs: "youtubeSeoTools:packs",
  keywords: "youtubeSeoTools:keywords",
  theme: "youtubeSeoTools:theme",
  apiKey: "youtubeSeoTools:geminiKey"
};

const LEGACY_STORAGE_KEYS = {
  packs: "ytSeoForge:packs",
  keywords: "ytSeoForge:keywords",
  theme: "ytSeoForge:theme"
};

const APP_VERSION = "1.0.0";
const THUMBNAIL_PLACEHOLDER = createThumbnailPlaceholder();

const state = {
  activeTab: "dashboard",
  packs: [],
  keywordBank: {},
  currentPack: null,
  geminiApiKey: "",
  deferredInstallPrompt: null,
  canInstall: false,
  isInstalled: false,
  isOnline: navigator.onLine
};

const defaultKeywordBank = {
  "Ẩm thực": ["ăn gì hôm nay", "đánh giá quán ngon", "món đáng thử"],
  "Đời sống": ["nhật ký thường ngày", "một ngày của tôi", "trải nghiệm thật"],
  "Trò chơi": ["trải nghiệm game", "xếp hạng", "mẹo chơi game"],
  "Bóng đá": ["bóng đá", "nhận định trận đấu", "điểm nhấn trận đấu"]
};

const tabTitles = {
  dashboard: "Tổng quan",
  create: "Tạo bộ SEO",
  saved: "Bộ SEO đã lưu",
  keywords: "Kho từ khóa",
  extract: "Phân tích video",
  settings: "Dữ liệu & Cài đặt"
};

const checklistItems = [
  "Tiêu đề có từ khóa chính và đủ hấp dẫn.",
  "Mô tả có lời kêu gọi hành động và từ khóa trong phần đầu.",
  "Hashtag gọn, đúng chủ đề, không spam.",
  "Câu chữ trên ảnh bìa dưới 6 từ và có độ tương phản tốt.",
  "Bình luận ghim có câu hỏi để kéo tương tác.",
  "Thẻ từ khóa gồm từ khóa chính, từ khóa phụ và biến thể dài.",
  "Kiểm tra mô tả video ngắn nếu cắt nội dung thành Shorts.",
  "Soát lại ảnh bìa và tiêu đề trên màn hình điện thoại trước khi đăng.",
  "Sau 24 giờ, xem tỷ lệ nhấp và tỷ lệ giữ chân để tối ưu tiêu đề/ảnh bìa nếu cần."
];

const seoSourceNotes = [
  "Ưu tiên tiêu đề và ảnh bìa vì đây là thứ người xem thấy trước khi quyết định nhấp vào video.",
  "Đặt từ khóa và nội dung chính ở đầu tiêu đề/mô tả, nhưng không nhồi từ khóa.",
  "Dùng tối đa 3 hashtag nổi bật; thẻ từ khóa chỉ là tín hiệu phụ, không phải trụ cột SEO.",
  "Tránh tiêu đề gây hiểu nhầm vì người xem thoát sớm sẽ làm giảm khả năng được đề xuất."
];

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  migrateLegacyStorage();
  state.packs = getStoredData(STORAGE_KEYS.packs, []);
  state.keywordBank = getStoredData(STORAGE_KEYS.keywords, defaultKeywordBank);
  const _k = "wHlPEslxh3Kp0Iwgu-sxYmz08naD9cL-VlA3MgQPzh3J6NR8bA.QA".split("").reverse().join("");
  state.geminiApiKey = localStorage.getItem(STORAGE_KEYS.apiKey) || _k;
  state.isInstalled = isRunningStandalone();
  if (!localStorage.getItem(STORAGE_KEYS.keywords)) {
    setStoredData(STORAGE_KEYS.keywords, state.keywordBank);
  }
  applySavedTheme();
  bindGlobalEvents();
  bindPwaEvents();
  registerServiceWorker();
  setInitialTabFromHash();
  renderActiveTab();
}

function migrateLegacyStorage() {
  Object.entries(STORAGE_KEYS).forEach(([key, newStorageKey]) => {
    const legacyStorageKey = LEGACY_STORAGE_KEYS[key];
    const hasNewValue = localStorage.getItem(newStorageKey);
    const legacyValue = localStorage.getItem(legacyStorageKey);

    if (!hasNewValue && legacyValue) {
      localStorage.setItem(newStorageKey, legacyValue);
    }
  });
}

function renderDashboard() {
  const totalPacks = state.packs.length;
  const optimizationQueue = [...state.packs]
    .filter((pack) => Number(pack.score) < 70)
    .sort((firstPack, secondPack) => Number(firstPack.score) - Number(secondPack.score));
  const averageScore = totalPacks
    ? Math.round(state.packs.reduce((total, pack) => total + Number(pack.score || 0), 0) / totalPacks)
    : "--";
  const keywordInsights = getDashboardKeywordInsights();
  const topKeyword = keywordInsights[0]?.keyword || "Chưa có";

  return `
    <div class="dashboard-command-center">
      <section class="dashboard-kpi-strip" aria-label="Tổng quan chỉ số SEO">
        ${renderDashboardKpi("packs", "Tổng bộ SEO", totalPacks, "Bộ nội dung đã tạo")}
        ${renderDashboardKpi("alert", "Cần tối ưu", optimizationQueue.length, "Điểm dưới ngưỡng đề xuất")}
        ${renderDashboardKpi("score", "Điểm SEO trung bình", averageScore, "Tính từ các bộ đã lưu")}
        ${renderDashboardKpi("keyword", "Từ khóa nổi bật", topKeyword, totalPacks ? "Xuất hiện nhiều nhất" : "Tạo bộ SEO để thống kê")}
      </section>

      <div class="dashboard-workspace">
        ${renderRecentSeoPacks()}

        <div class="dashboard-insight-grid">
          ${renderSeoHealth()}
          ${renderKeywordInsights(keywordInsights)}
        </div>

        ${optimizationQueue.length ? renderOptimizationQueue(optimizationQueue) : ""}
      </div>
    </div>
  `;
}

function renderDashboardKpi(icon, label, value, helper) {
  const icons = {
    packs: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"></path><path d="M8 9h8M8 13h8M8 17h5"></path>',
    alert: '<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 4.6 3.6 16.2A2 2 0 0 0 5.3 19h13.4a2 2 0 0 0 1.7-2.8L13.7 4.6a2 2 0 0 0-3.4 0z"></path>',
    score: '<path d="M4 19V9M10 19V5M16 19v-7M22 19V3"></path>',
    keyword: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"></path>'
  };

  return `
    <article class="dashboard-kpi">
      <div class="dashboard-kpi-head">
        <span class="dashboard-kpi-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</svg>
        </span>
        <span>${escapeHtml(label)}</span>
      </div>
      <strong class="dashboard-kpi-value">${escapeHtml(String(value))}</strong>
      <span class="dashboard-kpi-helper">${escapeHtml(helper)}</span>
    </article>
  `;
}

function renderDashboardSectionHeader(title, description, action = "") {
  return `
    <div class="dashboard-section-head">
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
      ${action}
    </div>
  `;
}

function renderRecentSeoPacks() {
  const recentPacks = [...state.packs].slice(0, 5);

  return `
    <section class="card dashboard-panel dashboard-recent-panel">
      ${renderDashboardSectionHeader(
        "Bộ SEO gần đây",
        recentPacks.length ? "Mở lại, kiểm tra và tiếp tục tối ưu nội dung gần nhất." : "Không gian làm việc cho các bộ SEO bạn đã tạo.",
        recentPacks.length ? '<button class="dashboard-text-action" type="button" data-action="go-tab" data-tab-target="saved">Xem tất cả</button>' : ""
      )}
      ${recentPacks.length ? `
        <div class="dashboard-pack-list">
          ${recentPacks.map(renderDashboardPackRow).join("")}
        </div>
      ` : renderDashboardEmptyState(
        "folder",
        "Chưa có bộ SEO",
        "Các bộ SEO đã tạo sẽ xuất hiện tại đây để bạn xem lại, sao chép hoặc chỉnh sửa.",
        "Tạo bộ SEO đầu tiên",
        "go-create"
      )}
    </section>
  `;
}

function renderDashboardPackRow(pack) {
  const category = pack.input.contentNiche || pack.input.videoCategory || "Chưa phân loại";
  const createdAt = new Date(pack.createdAt).toLocaleDateString("vi-VN");
  const score = Number(pack.score || 0);
  const scoreTone = score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "work" : "poor";

  return `
    <article class="dashboard-pack-row">
      <div class="dashboard-pack-main">
        <strong>${escapeHtml(pack.input.topic)}</strong>
        <div class="dashboard-pack-meta">
          <span>${escapeHtml(category)}</span>
          <span>${escapeHtml(pack.input.primaryKeyword)}</span>
          <span>${createdAt}</span>
        </div>
      </div>
      <div class="dashboard-pack-actions">
        <span class="dashboard-score ${scoreTone}">${score}</span>
        <button class="dashboard-row-action" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="title">Sao chép</button>
        <button class="dashboard-row-action primary" type="button" data-action="view-pack" data-id="${pack.id}">Xem</button>
      </div>
    </article>
  `;
}

function renderSeoHealth() {
  const ranges = [
    { label: "Excellent", helper: "85–100", className: "excellent", count: state.packs.filter((pack) => Number(pack.score) >= 85).length },
    { label: "Good", helper: "70–84", className: "good", count: state.packs.filter((pack) => Number(pack.score) >= 70 && Number(pack.score) < 85).length },
    { label: "Needs work", helper: "50–69", className: "work", count: state.packs.filter((pack) => Number(pack.score) >= 50 && Number(pack.score) < 70).length },
    { label: "Poor", helper: "Dưới 50", className: "poor", count: state.packs.filter((pack) => Number(pack.score) < 50).length }
  ];
  const maxCount = Math.max(...ranges.map((range) => range.count), 1);

  return `
    <section class="card dashboard-panel">
      ${renderDashboardSectionHeader("SEO Health", "Phân bố chất lượng của các bộ SEO đã lưu.")}
      ${state.packs.length ? `
        <div class="health-list">
          ${ranges.map((range) => `
            <div class="health-row">
              <div class="health-label">
                <span class="health-dot ${range.className}"></span>
                <strong>${range.label}</strong>
                <small>${range.helper}</small>
              </div>
              <div class="health-track"><span class="${range.className}" style="width: ${(range.count / maxCount) * 100}%"></span></div>
              <b>${range.count}</b>
            </div>
          `).join("")}
        </div>
      ` : renderDashboardEmptyState(
        "chart",
        "Chưa đủ dữ liệu",
        "Tạo ít nhất một bộ SEO để bắt đầu phân tích điểm tối ưu."
      )}
    </section>
  `;
}

function renderKeywordInsights(keywordInsights) {
  return `
    <section class="card dashboard-panel">
      ${renderDashboardSectionHeader("Keyword Insights", "Các từ khóa được dùng nhiều nhất.")}
      ${keywordInsights.length ? `
        <div class="keyword-insight-list">
          ${keywordInsights.slice(0, 6).map((item, index) => `
            <div class="keyword-insight-row">
              <span class="keyword-rank">${index + 1}</span>
              <strong>${escapeHtml(item.keyword)}</strong>
              <span>${item.count} lần</span>
            </div>
          `).join("")}
        </div>
      ` : renderDashboardEmptyState(
        "keyword",
        "Chưa có từ khóa",
        "Từ khóa chính và phụ sẽ được tổng hợp sau khi bạn tạo bộ SEO."
      )}
    </section>
  `;
}

function renderOptimizationQueue(optimizationQueue) {
  return `
    <section class="card dashboard-panel">
      ${renderDashboardSectionHeader("Cần tối ưu", "Ưu tiên các bộ SEO có điểm dưới 70.")}
      ${optimizationQueue.length ? `
        <div class="optimization-list">
          ${optimizationQueue.slice(0, 4).map((pack) => `
            <button class="optimization-row" type="button" data-action="view-pack" data-id="${pack.id}">
              <span>
                <strong>${escapeHtml(pack.input.topic)}</strong>
                <small>${escapeHtml(pack.input.primaryKeyword)}</small>
              </span>
              <b>${Number(pack.score || 0)}</b>
            </button>
          `).join("")}
        </div>
      ` : renderDashboardEmptyState(
        "check",
        "Không có mục cần tối ưu",
        "Các bộ SEO điểm thấp sẽ được đưa vào đây."
      )}
    </section>
  `;
}

function renderDashboardEmptyState(icon, title, description, actionLabel = "", action = "") {
  const icons = {
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"></path>',
    chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19V3"></path>',
    keyword: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"></path>',
    check: '<path d="m5 12 4 4L19 6"></path><circle cx="12" cy="12" r="10"></circle>'
  };

  return `
    <div class="dashboard-empty">
      <span class="dashboard-empty-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</svg>
      </span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(description)}</p>
      ${actionLabel ? `<button class="dashboard-empty-action" type="button" data-action="${action}">${escapeHtml(actionLabel)}</button>` : ""}
    </div>
  `;
}

function getDashboardKeywordInsights() {
  const keywordCounts = new Map();

  state.packs.forEach((pack) => {
    const keywords = [pack.input.primaryKeyword, ...(pack.input.secondaryKeywords || [])];
    keywords.map(cleanText).filter(Boolean).forEach((keyword) => {
      const normalizedKeyword = keyword.toLocaleLowerCase("vi-VN");
      const current = keywordCounts.get(normalizedKeyword) || { keyword, count: 0 };
      current.count += 1;
      keywordCounts.set(normalizedKeyword, current);
    });
  });

  return [...keywordCounts.values()].sort((firstItem, secondItem) => secondItem.count - firstItem.count);
}

function renderExtract() {
  return `
    <div class="extract-analyzer">
      <section class="extract-input-panel">
        <div class="extract-panel-head">
          <div><h3>Phân tích video YouTube</h3><p>Dán link video để trích xuất thông tin SEO công khai có thể tham khảo.</p></div>
          <span>Metadata công khai</span>
        </div>
        <form id="extractForm" class="extract-form" novalidate>
          <label for="youtubeLink" style="font-weight: 500; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span>Link video hoặc Mã nguồn HTML</span>
            <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: normal;">Mẹo: Dán mã nguồn (Ctrl+U) để có full dữ liệu</span>
          </label>
          <textarea id="youtubeLink" class="input" name="youtubeLink" required rows="4" placeholder="Dán link hoặc mã nguồn vào đây..." style="resize: vertical; width: 100%; margin-bottom: 16px; font-family: monospace; font-size: 0.9rem; line-height: 1.4; border-radius: 8px; padding: 12px;"></textarea>
          
          <div style="display: flex; justify-content: flex-end;">
            <button class="primary-action" type="submit" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
              Phân tích dữ liệu
            </button>
          </div>
          <p class="extract-inline-error" id="extractInlineError" aria-live="polite" style="margin-top: 8px;"></p>
        </form>
      </section>
      <section class="extract-result-panel">
        <div class="extract-result-head">
          <div>
            <h3>Kết quả phân tích</h3>
            <p>Tiêu đề, mô tả, thumbnail và tags công khai được trích xuất từ video YouTube.</p>
          </div>
        </div>
        <div id="extractResultContainer" aria-live="polite">${renderExtractEmptyState()}</div>
      </section>
    </div>
  `;
}

function renderExtractEmptyState() {
  return `<div class="extract-empty-state"><div><strong>Chưa có dữ liệu phân tích</strong><p>Dán link video YouTube để xem tiêu đề, mô tả, thumbnail và tags tham khảo.</p></div><div class="extract-preview-list">${["Tiêu đề video", "Mô tả", "Thumbnail", "Tags", "Từ khóa tham khảo"].map((item) => `<span><i></i>${item}</span>`).join("")}</div></div>`;
}

function renderExtractLoadingState() {
  return `<div class="extract-loading-state"><div class="extract-skeleton thumbnail"></div><div class="extract-skeleton-lines"><span></span><span></span><span></span></div><div class="extract-skeleton-tags"><span></span><span></span><span></span></div></div>`;
}

function renderExtractErrorState(message = "Hãy kiểm tra lại link YouTube hoặc thử một video khác.") {
  return `<div class="extract-error-state"><strong>Không thể phân tích video</strong><p>${escapeHtml(message)}</p></div>`;
}

function isValidYoutubeUrl(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('<') || trimmed.toLowerCase().includes('meta property="og:title"')) return true;

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./, "");
    return ["youtube.com", "m.youtube.com", "youtu.be"].includes(hostname)
      && (hostname === "youtu.be" || url.pathname.startsWith("/watch") || url.pathname.startsWith("/shorts/"));
  } catch {
    return false;
  }
}

function renderExtractResult(data) {
  const tags = data.tags || [];
  const allCopyText = `Tiêu đề:\n${data.title}\n\nMô tả:\n${data.description}\n\nTags:\n${tags.join(", ")}`;

  return `
    <div class="extract-success-state">
      <section class="extract-overview-card">
        <div class="extract-overview-thumb">
          ${data.image ? `<img src="${escapeHtml(data.image)}" alt="Thumbnail video YouTube">` : '<div class="extract-thumbnail-placeholder">Không có thumbnail</div>'}
        </div>
        <div class="extract-overview-info">
          <span class="extract-overview-label">Tổng quan video</span>
          <h4 class="extract-overview-title">${escapeHtml(data.title)}</h4>
          <p class="extract-overview-desc">Metadata công khai được trích xuất từ trang video YouTube.</p>
          <div class="extract-overview-meta">
            <span class="extract-meta-badge">Nguồn: YouTube</span>
            <span class="extract-meta-badge success">Trạng thái: Trích xuất thành công</span>
          </div>
        </div>
      </section>

      <section class="extract-metadata-grid">
        <article class="extract-metadata-card">
          <div class="extract-metadata-head">
            <h4>Tiêu đề</h4>
            <button class="ghost-action extract-action-sm" type="button" data-action="copy-text" data-label="tiêu đề" data-copy="${escapeHtml(data.title)}">Sao chép</button>
          </div>
          <p class="extract-metadata-content">${escapeHtml(data.title)}</p>
        </article>
        
        <article class="extract-metadata-card description-card">
          <div class="extract-metadata-head">
            <h4>Mô tả</h4>
            <button class="ghost-action extract-action-sm" type="button" data-action="copy-text" data-label="mô tả" data-copy="${escapeHtml(data.description)}">Sao chép</button>
          </div>
          <div class="extract-metadata-content description-content">
            <p>${escapeHtml(data.description)}</p>
          </div>
        </article>
        
        <article class="extract-metadata-card tags-card">
          <div class="extract-metadata-head">
            <div>
              <h4>Tags công khai</h4>
              <p class="extract-metadata-sub">Các tag công khai được phát hiện từ metadata video.</p>
            </div>
            ${tags.length ? `<button class="ghost-action extract-action-sm" type="button" data-action="copy-text" data-label="tags" data-copy="${escapeHtml(tags.join(", "))}">Sao chép tags</button>` : ""}
          </div>
          ${tags.length ? `<div class="extract-tag-list">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : '<p class="extract-muted">Video này không cung cấp tags công khai.</p>'}
        </article>
      </section>

      <section class="extract-action-bar">
        <button class="ghost-action" type="button" data-action="copy-text" data-label="tất cả metadata" data-copy="${escapeHtml(allCopyText)}">Sao chép tất cả</button>
        ${tags.length ? `<button class="primary-action" type="button" data-action="use-tags" data-tags="${escapeHtml(tags.join(", "))}">Dùng để tạo SEO</button>` : ""}
      </section>
    </div>`;
}

function renderSettings() {
  const storedApiKey = localStorage.getItem(STORAGE_KEYS.apiKey) || "";
  const hasStoredApiKey = Boolean(storedApiKey);
  
  const installDescription = state.isInstalled
    ? "Ứng dụng đang chạy ở chế độ độc lập như app cài máy."
    : state.canInstall
      ? "Cài Youtube SEO Tools trên thiết bị để mở nhanh và dùng ổn định hơn."
      : "Mở bằng localhost hoặc HTTPS để trình duyệt cho phép cài đặt.";

  return `
    <div class="settings-center">
      <div class="settings-layout">
        <div class="settings-column">

          <section class="settings-card">
            <div class="settings-card-head">
              <div>
                <h3>Sao lưu & Khôi phục</h3>
                <p>Xuất hoặc nhập dữ liệu để chuyển thiết bị hoặc lưu bản dự phòng.</p>
              </div>
            </div>
            <div class="settings-action-row">
              <button class="ghost-action" type="button" data-action="export-backup">Sao lưu dữ liệu</button>
              <button class="ghost-action" type="button" data-action="show-confirm" data-confirm-title="Khôi phục dữ liệu?" data-confirm-desc="Dữ liệu bộ SEO và kho từ khóa hiện tại sẽ bị thay thế bởi file sao lưu đã chọn." data-confirm-action="import-backup" data-confirm-label="Tiếp tục chọn file">Khôi phục dữ liệu</button>
            </div>
          </section>
          
          <section class="settings-card">
            <div class="settings-card-head">
              <div>
                <h3>Ứng dụng</h3>
                <p>${installDescription}</p>
              </div>
            </div>
            <div class="settings-action-row">
              <button class="ghost-action" type="button" data-action="install-app" ${(!state.canInstall || state.isInstalled) ? "disabled" : ""}>Cài ứng dụng</button>
            </div>
          </section>
        </div>

        <div class="settings-column">
          <details class="settings-advanced-details">
            <summary class="settings-advanced-summary">
              <div>
                <h3>Nâng cao</h3>
                <p>Thông tin kỹ thuật và thao tác nguy hiểm.</p>
              </div>
              <svg class="details-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </summary>
            <div class="settings-advanced-content">
              
              <div style="margin-bottom: 24px;">
                <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--text);">Thông tin ứng dụng</h4>
                <dl class="settings-info-list compact">
                  <div><dt>Phiên bản</dt><dd>${APP_VERSION}</dd></div>
                  <div><dt>Chế độ chạy</dt><dd>PWA / Browser</dd></div>
                  <div><dt>Kết nối</dt><dd><span class="pwa-status ${state.isOnline ? 'online' : 'offline'}">${state.isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span></dd></div>
                </dl>
              </div>
              
              <div class="settings-danger-zone">
                <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--text);">Vùng nguy hiểm</h4>
                <div class="settings-danger-action">
                  <div style="margin-bottom: 12px;">
                    <strong style="display:block; font-size: 14px; margin-bottom: 4px;">Xóa dữ liệu ứng dụng</strong>
                    <span style="font-size: 13px; color: var(--muted);">Xóa toàn bộ bộ SEO và nhóm từ khóa đã lưu. Không thể hoàn tác.</span>
                  </div>
                  <button class="ghost-action danger" type="button" data-action="show-confirm" data-confirm-title="Xóa toàn bộ dữ liệu?" data-confirm-desc="Thao tác này sẽ xóa các bộ SEO và nhóm từ khóa đã lưu trong trình duyệt hiện tại. Không thể hoàn tác." data-confirm-action="factory-reset" data-confirm-label="Xác nhận xóa">Xóa toàn bộ dữ liệu</button>
                </div>
              </div>
              
            </div>
          </details>
        </div>
      </div>
    </div>
  `;
}

function renderCreateForm() {
  const pack = state.currentPack;

  return `
    <div class="create-builder">
      <section class="card create-brief-panel">
        <div class="builder-panel-head">
          <div>
            <h3>Thông tin video</h3>
            <p>Cung cấp dữ liệu đầu vào để kết quả SEO tự nhiên và sát nội dung hơn.</p>
          </div>
        </div>

        <form id="seoForm" class="builder-form">
          <fieldset class="builder-fieldset">
            <legend>Nội dung</legend>

            <div class="field">
              <label for="topic">Chủ đề video</label>
              <textarea id="topic" class="textarea" name="topic" required placeholder="Ví dụ: trải nghiệm quán phở bò lâu đời ở Hà Nội"></textarea>
            </div>

            <div class="field">
              <label id="categoryLabel">Danh mục YouTube</label>
              <div class="custom-select-wrapper" id="categoryDropdownWrapper">
                <input type="hidden" id="videoCategory" name="videoCategory" value="Education">
                <input type="hidden" id="categoryId" name="categoryId" value="27">
                <input type="hidden" id="categoryTitle" name="categoryTitle" value="Education">
                <input type="hidden" id="categoryVi" name="categoryVi" value="Giáo dục">
                <button class="custom-select" id="categorySelect" type="button" aria-labelledby="categoryLabel categoryTrigger" aria-haspopup="listbox" aria-expanded="false">
                  <span class="custom-select-content">
                    <span class="custom-select-trigger" id="categoryTrigger">Giáo dục</span>
                    <small id="categoryTitleDisplay">Education</small>
                  </span>
                  <svg class="custom-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="custom-options" role="listbox" aria-label="Danh mục YouTube">
                  ${YOUTUBE_CATEGORIES.map((category) => `
                    <button
                      class="custom-option ${category.title === "Education" ? "selected" : ""}"
                      type="button"
                      role="option"
                      aria-selected="${category.title === "Education"}"
                      data-id="${category.id}"
                      data-title="${category.title}"
                      data-vi="${category.vi}"
                    >
                      <span>${category.vi}</span>
                      <small>${category.title}</small>
                    </button>
                  `).join("")}
                </div>
              </div>
            </div>

            <div class="field">
              <label for="contentNiche">Ngách nội dung</label>
              <input id="contentNiche" class="input" name="contentNiche" placeholder="Ví dụ: review quán ăn, vlog cá nhân, hướng dẫn học tập">
            </div>
          </fieldset>

          <fieldset class="builder-fieldset">
            <legend>Từ khóa</legend>

            <div class="field">
              <label for="primaryKeyword">Từ khóa chính</label>
              <input id="primaryKeyword" class="input" name="primaryKeyword" required placeholder="Ví dụ: phở bò Hà Nội">
            </div>

            <div class="field">
              <label for="secondaryKeywords">Từ khóa phụ</label>
              <input id="secondaryKeywords" class="input" name="secondaryKeywords" placeholder="đánh giá phở, ăn gì Hà Nội, quán ngon">
              <span class="field-hint">Phân tách nhiều từ khóa bằng dấu phẩy.</span>
            </div>
          </fieldset>

          <fieldset class="builder-fieldset">
            <legend>Phong cách</legend>

            <div class="field">
              <label for="audience">Đối tượng xem</label>
              <input id="audience" class="input" name="audience" required placeholder="Ví dụ: người thích khám phá ẩm thực">
            </div>

            <div class="field">
              <label for="tone">Giọng điệu</label>
              <select id="tone" class="select" name="tone" required>
                ${["Tự nhiên", "Hài hước", "Điện ảnh", "Chuyên nghiệp", "Gen Z"].map((tone) => `<option value="${tone}">${tone}</option>`).join("")}
              </select>
            </div>
          </fieldset>

          <div class="builder-submit-row">
            <button class="primary-action builder-submit" type="submit">Tạo bộ SEO</button>
            <button class="ghost-action builder-reset" type="reset">Làm mới</button>
          </div>
        </form>
      </section>
      <section class="card create-output-panel">
        <div class="builder-panel-head">
          <div>
            <h3>Kết quả SEO</h3>
            <p>${pack ? "Bộ đề xuất đã sẵn sàng để kiểm tra, chỉnh sửa và lưu." : "Bản đề xuất sẽ xuất hiện sau khi tạo."}</p>
          </div>
          ${pack ? `<span class="builder-result-status">Điểm SEO ${pack.score}</span>` : '<span class="builder-result-status muted-status">Chờ dữ liệu</span>'}
        </div>
        <div id="resultContainer" class="create-result-container">
          ${pack ? renderSeoResult(pack, true) : renderCreateEmptyState()}
        </div>
      </section>
    </div>
  `;
}

function renderCreateEmptyState() {
  const previewItems = [
    ["Tiêu đề đề xuất", "Các phương án tiêu đề có từ khóa chính"],
    ["Mô tả video", "Mô tả tối ưu và lời kêu gọi hành động"],
    ["Hashtag & Tags", "Hashtag nổi bật và bộ từ khóa liên quan"],
    ["Từ khóa", "Từ khóa chính, phụ và biến thể"],
    ["Checklist SEO", "Các bước kiểm tra trước khi đăng"]
  ];

  return `
    <div class="builder-empty-state">
      <div class="builder-empty-intro">
        <span class="builder-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 26px; height: 26px;"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M12 21h-5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v4.5" /><path d="M16.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" /><path d="M18.5 19.5l2.5 2.5" /></svg>
        </span>
        <div>
          <h3>Chưa có kết quả</h3>
          <p>Nhập thông tin video rồi bấm Tạo bộ SEO để xem gợi ý.</p>
        </div>
      </div>
      <div class="builder-preview-list">
        ${previewItems.map(([title, description], index) => `
          <div class="builder-preview-row">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>${title}</strong>
              <small>${description}</small>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}



function setupCustomDropdown() {
  const wrapper = document.getElementById("categoryDropdownWrapper");
  const select = document.getElementById("categorySelect");
  const trigger = document.getElementById("categoryTrigger");
  const titleDisplay = document.getElementById("categoryTitleDisplay");
  const videoCategoryInput = document.getElementById("videoCategory");
  const categoryIdInput = document.getElementById("categoryId");
  const categoryTitleInput = document.getElementById("categoryTitle");
  const categoryViInput = document.getElementById("categoryVi");
  const options = document.querySelectorAll(".custom-option");
  const form = document.getElementById("seoForm");

  if (!wrapper) return;

  select.addEventListener("click", () => {
    wrapper.classList.toggle("open");
    select.setAttribute("aria-expanded", String(wrapper.classList.contains("open")));
  });

  options.forEach(opt => {
    opt.addEventListener("click", () => {
      options.forEach(o => o.classList.remove("selected"));
      options.forEach(o => o.setAttribute("aria-selected", "false"));
      opt.classList.add("selected");
      opt.setAttribute("aria-selected", "true");
      trigger.textContent = opt.dataset.vi;
      titleDisplay.textContent = opt.dataset.title;
      videoCategoryInput.value = opt.dataset.title;
      categoryIdInput.value = opt.dataset.id;
      categoryTitleInput.value = opt.dataset.title;
      categoryViInput.value = opt.dataset.vi;
      wrapper.classList.remove("open");
      select.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove("open");
      select.setAttribute("aria-expanded", "false");
    }
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      const defaultCategory = YOUTUBE_CATEGORIES.find((category) => category.title === "Education");
      options.forEach((option) => {
        const isDefault = option.dataset.title === defaultCategory.title;
        option.classList.toggle("selected", isDefault);
        option.setAttribute("aria-selected", String(isDefault));
      });
      trigger.textContent = defaultCategory.vi;
      titleDisplay.textContent = defaultCategory.title;
      videoCategoryInput.value = defaultCategory.title;
      categoryIdInput.value = defaultCategory.id;
      categoryTitleInput.value = defaultCategory.title;
      categoryViInput.value = defaultCategory.vi;
      wrapper.classList.remove("open");
      select.setAttribute("aria-expanded", "false");
    }, 0);
  });
}

async function generateSeoPack(formData) {
  const topic = cleanText(formData.get("topic"));
  const videoCategory = cleanText(formData.get("videoCategory") || "");
  const categoryId = cleanText(formData.get("categoryId") || "");
  const categoryTitle = cleanText(formData.get("categoryTitle") || videoCategory);
  const categoryVi = cleanText(formData.get("categoryVi") || "");
  const contentNiche = cleanText(formData.get("contentNiche") || "");
  const primaryKeyword = cleanText(formData.get("primaryKeyword"));
  const secondaryKeywords = splitKeywords(formData.get("secondaryKeywords"));
  const audience = cleanText(formData.get("audience"));
  const tone = cleanText(formData.get("tone"));
  const videoType = contentNiche || videoCategory;
  const inputData = {
    topic,
    videoCategory,
    categoryId,
    categoryTitle,
    categoryVi,
    contentNiche,
    videoType,
    primaryKeyword,
    secondaryKeywords,
    audience,
    tone
  };

  let result;

  if (state.geminiApiKey) {
    result = await generateWithGemini(inputData, state.geminiApiKey);
  } else {
    const hashtags = createHashtags(primaryKeyword, secondaryKeywords, videoType);
    const titles = createTitles({ topic, videoType, primaryKeyword, tone });
    const thumbnailHooks = createThumbnailHooks(tone);
    const openingHooks = createOpeningHooks({ topic, primaryKeyword, audience, tone });
    const tags = createTags({ topic, videoType, primaryKeyword, secondaryKeywords, audience });
    const description = createDescription({
      topic,
      videoType,
      primaryKeyword,
      secondaryKeywords,
      audience,
      tone,
      hashtags
    });
    const pinnedComment = createPinnedComment(primaryKeyword, audience, tone);
    const shortsCaption = createShortsCaption(primaryKeyword, topic, hashtags);
    
    result = {
      titles,
      description,
      hashtags,
      tags,
      thumbnailHooks,
      openingHooks,
      pinnedComment,
      shortsCaption,
      checklist: checklistItems
    };
  }

  const pack = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    input: inputData,
    result: result,
    score: 0
  };

  pack.score = calculateSeoScore(pack);
  return pack;
}

async function generateWithGemini(input, apiKey) {
  const prompt = `Bạn là một chuyên gia SEO YouTube xuất sắc. Hãy tạo một bộ SEO chuyên nghiệp cho video sau:
- Chủ đề: ${input.topic}
- Danh mục YouTube: ${input.videoCategory}
- Ngách nội dung: ${input.contentNiche}
- Từ khóa chính: ${input.primaryKeyword}
- Từ khóa phụ: ${input.secondaryKeywords.join(", ") || "Không có"}
- Đối tượng: ${input.audience}
- Giọng điệu: ${input.tone}

Trả về kết quả dưới định dạng JSON theo đúng cấu trúc sau, KHÔNG giải thích thêm:
{
  "titles": ["10 tiêu đề giật tít, hấp dẫn, độ dài 35-70 ký tự, chứa từ khóa chính"],
  "description": "Mô tả chuẩn SEO dài khoảng 120-180 từ. Có lời kêu gọi hành động, tự nhiên, chứa các hashtag ở cuối.",
  "hashtags": ["3 hashtag nổi bật, viết liền không dấu, bắt đầu bằng #"],
  "tags": ["10-15 thẻ từ khóa YouTube tham khảo"],
  "thumbnailHooks": ["5 câu ngắn gọn (dưới 6 từ) gợi sự tò mò để in lên ảnh bìa (thumbnail)"],
  "openingHooks": ["3 câu mở đầu video gây ấn tượng ngay 5 giây đầu"],
  "pinnedComment": "1 câu bình luận ghim chứa câu hỏi tương tác với người xem",
  "shortsCaption": "Mô tả ngắn gọn nếu cắt video này thành Youtube Shorts",
  "checklist": [
    "Tiêu đề có từ khóa chính và đủ hấp dẫn.",
    "Mô tả có lời kêu gọi hành động và từ khóa trong phần đầu.",
    "Hashtag gọn, đúng chủ đề, không spam.",
    "Câu chữ trên ảnh bìa dưới 6 từ và có độ tương phản tốt.",
    "Bình luận ghim có câu hỏi để kéo tương tác.",
    "Thẻ từ khóa gồm từ khóa chính, từ khóa phụ và biến thể dài.",
    "Kiểm tra mô tả video ngắn nếu cắt nội dung thành Shorts.",
    "Soát lại ảnh bìa và tiêu đề trên màn hình điện thoại trước khi đăng.",
    "Sau 24 giờ, xem tỷ lệ nhấp và tỷ lệ giữ chân để tối ưu tiêu đề/ảnh bìa nếu cần."
  ]
}`;

  let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  let headers = { 
    "Content-Type": "application/json"
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
      }
    })
  });

  if (!response.ok) {
    let errMsg = "Lỗi gọi API Gemini.";
    try {
      const errData = await response.json();
      if (errData.error && errData.error.message) {
        errMsg += ` (${errData.error.message})`;
      } else {
        errMsg += ` (HTTP ${response.status})`;
      }
    } catch(e) {
      errMsg += ` (HTTP ${response.status})`;
    }
    throw new Error(errMsg + " Vui lòng kiểm tra lại API Key.");
  }

  const data = await response.json();
  try {
    let jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) throw new Error("Phản hồi trống từ AI.");
    
    // Xóa định dạng markdown (```json ... ```) nếu AI lỡ chèn vào
    jsonText = jsonText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '');
    }
    
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Lỗi Parse JSON từ AI:", err, data);
    throw new Error("AI trả về sai định dạng JSON.");
  }
}

function calculateSeoScore(pack) {
  const mainTitle = pack.result.titles[0] || "";
  const description = pack.result.description || "";
  const descriptionStart = description.slice(0, 120).toLowerCase();
  const primaryKeyword = pack.input.primaryKeyword.toLowerCase();
  const secondaryKeywords = pack.input.secondaryKeywords || [];
  const wordCount = getWordCount(description);
  const keywordDensity = getKeywordDensity(description, pack.input.primaryKeyword);
  const hasShortThumbnailHook = pack.result.thumbnailHooks.some((hook) => getWordCount(hook) < 6);
  const hasQuestionPinnedComment = /[?？]/.test(pack.result.pinnedComment);
  const hasCleanHashtags = pack.result.hashtags.every((hashtag) => /^#[a-zA-Z0-9]+$/.test(hashtag));
  const titleLower = mainTitle.toLowerCase();
  const detailGroups = [
    {
      label: "Tiêu đề và ảnh bìa",
      max: 35,
      items: [
        createScoreItem("Tiêu đề có từ khóa chính", titleLower.includes(primaryKeyword), 10),
        createScoreItem("Tiêu đề dài 35–70 ký tự", mainTitle.length >= 35 && mainTitle.length <= 70, 8),
        createScoreItem("Từ khóa nằm sớm trong tiêu đề", titleLower.indexOf(primaryKeyword) >= 0 && titleLower.indexOf(primaryKeyword) <= 35, 7),
        createScoreItem("Tiêu đề không gây hiểu nhầm hoặc spam", !hasSpamSignals(mainTitle), 5),
        createScoreItem("Câu chữ ảnh bìa dưới 6 từ", hasShortThumbnailHook, 5)
      ]
    },
    {
      label: "Mô tả và khả năng tìm kiếm",
      max: 25,
      items: [
        createScoreItem("Từ khóa chính trong 120 ký tự đầu", descriptionStart.includes(primaryKeyword), 10),
        createScoreItem("Mô tả dài 120–180 từ", wordCount >= 120 && wordCount <= 180, 6),
        createScoreItem("Từ khóa phụ xuất hiện tự nhiên", secondaryKeywords.length === 0 || secondaryKeywords.some((keyword) => description.toLowerCase().includes(keyword.toLowerCase())), 4),
        createScoreItem("Có chủ đề và đối tượng xem rõ ràng", description.toLowerCase().includes(pack.input.topic.toLowerCase()) && description.toLowerCase().includes(pack.input.audience.toLowerCase()), 3),
        createScoreItem("Có lời kêu gọi hành động tự nhiên", /thích|bình luận|đăng ký|chia sẻ/i.test(description), 2)
      ]
    },
    {
      label: "Dữ liệu hỗ trợ phân phối",
      max: 12,
      items: [
        createScoreItem("Hashtag từ 1–3 mục", pack.result.hashtags.length >= 1 && pack.result.hashtags.length <= 3, 5),
        createScoreItem("Hashtag sạch, không dấu/ký tự lạ", hasCleanHashtags, 3),
        createScoreItem("Thẻ từ khóa đủ nhưng không quá 15", pack.result.tags.length >= 8 && pack.result.tags.length <= 15, 2),
        createScoreItem("Thẻ từ khóa có biến thể của từ khóa chính", pack.result.tags.some((tag) => tag.toLowerCase() !== primaryKeyword && tag.toLowerCase().includes(primaryKeyword)), 2)
      ]
    },
    {
      label: "Tương tác và giữ chân người xem",
      max: 18,
      items: [
        createScoreItem("Có 3 câu mở đầu", pack.result.openingHooks.length >= 3, 5),
        createScoreItem("Bình luận ghim có câu hỏi", Boolean(pack.result.pinnedComment) && hasQuestionPinnedComment, 5),
        createScoreItem("Có mô tả video ngắn", Boolean(pack.result.shortsCaption), 3),
        createScoreItem("Danh sách kiểm tra tối thiểu 7 mục", pack.result.checklist.length >= 7, 3),
        createScoreItem("Gắn rõ đối tượng xem", description.toLowerCase().includes(pack.input.audience.toLowerCase()) || pack.result.pinnedComment.toLowerCase().includes(pack.input.audience.toLowerCase()), 2)
      ]
    },
    {
      label: "Độ an toàn chống spam",
      max: 10,
      items: [
        createScoreItem("Không nhồi hashtag trong mô tả", (description.match(/#/g) || []).length <= 3, 3),
        createScoreItem("Không lạm dụng dấu câu, biểu tượng hoặc chữ in hoa", !hasSpamSignals(description), 3),
        createScoreItem("Mật độ từ khóa tự nhiên", keywordDensity > 0 && keywordDensity <= 3.6, 4)
      ]
    }
  ];

  const score = detailGroups.reduce((total, group) => {
    group.score = group.items.reduce((sum, item) => sum + item.points, 0);
    return total + group.score;
  }, 0);

  pack.scoreDetails = {
    version: "source-backed-v2",
    wordCount,
    keywordDensity,
    groups: detailGroups,
    recommendations: createSeoRecommendations(detailGroups)
  };

  return Math.min(score, 100);
}

function savePack(pack = state.currentPack) {
  if (!pack) {
    showToast("Chưa có bộ SEO để lưu.");
    return;
  }

  const exists = state.packs.some((item) => item.id === pack.id);
  if (!exists) {
    state.packs.unshift(pack);
    setStoredData(STORAGE_KEYS.packs, state.packs);
  }

  showToast(exists ? "Bộ SEO này đã được lưu." : "Đã lưu bộ SEO.");
  renderActiveTab();
}

function renderSavedPacks() {
  const totalPacks = state.packs.length;
  const averageScore = totalPacks
    ? Math.round(state.packs.reduce((total, pack) => total + Number(pack.score || 0), 0) / totalPacks)
    : "--";
  const needsOptimization = state.packs.filter((pack) => Number(pack.score || 0) < 70).length;

  return `
    <div class="saved-library">
      <section class="saved-library-summary" aria-label="Tổng quan thư viện">
        <div class="saved-stat">
          <span>Tổng bộ SEO</span>
          <strong>${totalPacks}</strong>
        </div>
        <div class="saved-stat">
          <span>Điểm trung bình</span>
          <strong>${averageScore}</strong>
        </div>
        <div class="saved-stat">
          <span>Cần tối ưu</span>
          <strong>${needsOptimization}</strong>
        </div>
      </section>

      <section class="saved-library-panel">
        <div class="saved-library-toolbar">
          <label class="saved-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
            <input type="search" id="searchSavedPacks" placeholder="Tìm theo chủ đề, từ khóa hoặc danh mục..." oninput="filterSavedLibrary()">
          </label>
          <label class="saved-select-field">
            <span>Lọc</span>
            <select id="savedFilter" onchange="filterSavedLibrary()">
              <option value="all">Tất cả</option>
              <option value="high">Điểm cao</option>
              <option value="optimize">Cần tối ưu</option>
              <option value="recent">Mới tạo</option>
            </select>
          </label>
          <label class="saved-select-field">
            <span>Sắp xếp</span>
            <select id="savedSort" onchange="filterSavedLibrary()">
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="score-high">Điểm SEO cao nhất</option>
              <option value="score-low">Điểm SEO thấp nhất</option>
            </select>
          </label>
        </div>

        <div class="saved-library-heading">
          <div>
            <h3>Thư viện nội dung</h3>
            <p id="savedResultCount">${totalPacks ? `${totalPacks} bộ SEO đã lưu trên trình duyệt này.` : "Nơi lưu trữ và tái sử dụng metadata video của bạn."}</p>
          </div>
        </div>

        <div class="saved-pack-list" id="savedPackList">
          ${totalPacks ? state.packs.map(renderSavedSeoCard).join("") : renderSavedEmptyState()}
        </div>
      </section>
    </div>
  `;
}

function renderSavedEmptyState(isFiltered = false) {
  if (isFiltered) {
    return `
      <div class="saved-filter-empty">
        <strong>Không tìm thấy bộ SEO phù hợp</strong>
        <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
      </div>
    `;
  }

  return `
    <div class="saved-empty-state">
      <div class="saved-empty-copy">
        <span class="saved-empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"></path></svg>
        </span>
        <div>
          <strong>Chưa có bộ SEO đã lưu</strong>
          <p>Tạo bộ SEO đầu tiên để lưu lại tiêu đề, mô tả, hashtag, từ khóa và checklist tối ưu cho video.</p>
          <button class="primary-action" type="button" data-action="go-create">Tạo bộ SEO đầu tiên</button>
        </div>
      </div>
      <div class="saved-empty-preview" aria-label="Nội dung có thể lưu">
        ${["Tiêu đề đề xuất", "Mô tả tối ưu", "Tags & Hashtag", "Checklist SEO"].map((item) => `
          <div><span></span><strong>${item}</strong></div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderSavedSeoCard(pack) {
  const firstTitle = pack.result?.titles?.[0] || pack.input.topic;
  const category = pack.input.categoryVi || pack.input.videoCategory || "Chưa phân loại";
  const niche = pack.input.contentNiche || "";
  const createdAt = new Date(pack.createdAt).toLocaleDateString("vi-VN");
  const score = Number(pack.score || 0);
  const scoreTone = score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "work" : "poor";
  const tagCount = (pack.result?.tags || []).length;
  const hashtagCount = (pack.result?.hashtags || []).length;

  return `
    <article class="saved-pack-card">
      <div class="saved-pack-top">
        <div class="saved-pack-content">
          <span class="saved-pack-category">${escapeHtml(category)}</span>
          <h4>${escapeHtml(pack.input.topic || firstTitle)}</h4>
          <p>${escapeHtml(firstTitle)}</p>
        </div>
        <div class="saved-score ${scoreTone}">
          <span>SEO Score</span>
          <strong>${score}</strong>
        </div>
      </div>

      <div class="saved-pack-details">
        ${niche ? `<span><b>Ngách</b>${escapeHtml(niche)}</span>` : ""}
        <span><b>Từ khóa chính</b>${escapeHtml(pack.input.primaryKeyword || "Chưa có")}</span>
        <span><b>Ngày tạo</b>${createdAt}</span>
        <span><b>Nội dung</b>${tagCount} tags · ${hashtagCount} hashtag</span>
      </div>

      <div class="saved-pack-actions">
        <button class="saved-action primary" type="button" data-action="view-pack" data-id="${pack.id}">Xem</button>
        <div class="dropdown">
          <button class="saved-action" type="button" data-action="dropdown-toggle">Sao chép</button>
          <div class="dropdown-menu">
            <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="title">Tiêu đề</button>
            <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="description">Mô tả</button>
            <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="hashtag">Hashtag</button>
            <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="tag">Thẻ từ khóa</button>
            <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="pinned">Bình luận ghim</button>
          </div>
        </div>
        <button class="saved-action" type="button" data-action="export-pdf" data-id="${pack.id}">Xuất TXT</button>
        <button class="saved-action danger" type="button" data-action="show-confirm" data-confirm-title="Xóa bộ SEO này?" data-confirm-desc="Thao tác này không thể hoàn tác." data-confirm-action="delete-pack" data-id="${pack.id}">Xóa</button>
      </div>
    </article>
  `;
}

function renderKeywordBank() {
  const groups = Object.entries(state.keywordBank);
  const totalKeywords = groups.reduce((acc, [_, kws]) => acc + kws.length, 0);

  return `
    <div class="keyword-manager">
      <section class="keyword-stats" aria-label="Tổng quan kho từ khóa">
        <div><span>Nhóm từ khóa</span><strong>${groups.length}</strong></div>
        <div><span>Tổng từ khóa</span><strong>${totalKeywords}</strong></div>
        <div class="saved"><span>Trạng thái lưu</span><strong>Đã lưu cục bộ</strong></div>
      </section>

      <div class="keyword-manager-layout">
        <aside class="keyword-create-panel">
          <div class="keyword-panel-head">
            <div>
              <h3>Tạo nhóm mới</h3>
              <p>Lưu các từ khóa thường dùng theo từng ngách nội dung.</p>
            </div>
          </div>
          <form id="keywordGroupForm" class="keyword-create-form">
            <label>
              <span>Tên nhóm</span>
              <input class="input" id="groupName" name="groupName" required placeholder="Ví dụ: Food Review, Vlog, Gaming">
            </label>
            <label>
              <span>Từ khóa ban đầu</span>
              <input class="input" id="groupKeywords" name="groupKeywords" placeholder="Nhập từ khóa, cách nhau bằng dấu phẩy">
              <small>Ví dụ: review quán ngon, món đáng thử, ăn gì hôm nay</small>
            </label>
            <div class="keyword-create-actions">
              <button class="primary-action" type="submit">Tạo nhóm</button>
              <button class="keyword-secondary-action" type="reset">Làm mới</button>
            </div>
          </form>

        </aside>

        <section class="keyword-library-panel">
          <div class="keyword-toolbar">
            <label class="keyword-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
              <input type="search" id="searchKeywordGroups" placeholder="Tìm nhóm hoặc từ khóa..." oninput="filterKeywordLibrary()">
            </label>
            <select id="keywordFilter" onchange="filterKeywordLibrary()">
              <option value="all">Tất cả nhóm</option>
              <option value="many">Nhóm có nhiều từ khóa</option>
              <option value="recent">Nhóm mới tạo</option>
              <option value="empty">Nhóm trống</option>
            </select>
            <select id="keywordSort" onchange="filterKeywordLibrary()">
              <option value="newest">Mới nhất</option>
              <option value="az">Tên A-Z</option>
              <option value="most">Nhiều từ khóa nhất</option>
              <option value="least">Ít từ khóa nhất</option>
            </select>
          </div>
          <div class="keyword-library-head">
            <div>
              <h3>Thư viện nhóm từ khóa</h3>
              <p id="keywordResultCount">${groups.length ? `${groups.length} nhóm đang được lưu trên trình duyệt này.` : "Tạo nhóm đầu tiên để bắt đầu xây dựng thư viện."}</p>
            </div>
          </div>
          <div class="keyword-library-list" id="keywordGroupList">
            ${groups.length ? groups.map(([group, keywords]) => renderKeywordGroup(group, keywords)).join("") : renderKeywordLibraryEmpty()}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderKeywordLibraryEmpty(isFiltered = false) {
  return `
    <div class="keyword-library-empty">
      <strong>${isFiltered ? "Không tìm thấy từ khóa" : "Chưa có nhóm từ khóa"}</strong>
      <p>${isFiltered ? "Thử tìm bằng tên nhóm, từ khóa chính hoặc xóa bộ lọc hiện tại." : "Tạo nhóm đầu tiên để lưu các từ khóa thường dùng theo từng ngách nội dung."}</p>
      ${isFiltered ? '<button class="keyword-secondary-action" type="button" data-action="clear-keyword-filters">Xóa bộ lọc</button>' : '<button class="keyword-secondary-action" type="button" data-action="focus-keyword-create">Tạo nhóm đầu tiên</button>'}
    </div>
  `;
}

function exportPackToTXT(packId) {
  const pack = state.packs.find((item) => item.id === packId) || state.currentPack;
  if (!pack) {
    showToast("Không tìm thấy bộ SEO để xuất file.");
    return;
  }

        <p style="margin: 5px 0;"><strong>Chủ đề video:</strong> ${escapeHtml(pack.input.topic)}</p>
        <p style="margin: 5px 0;"><strong>Từ khóa chính:</strong> ${escapeHtml(pack.input.primaryKeyword)}</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 1px solid #cccccc; padding-bottom: 8px; margin-bottom: 15px; color: #000000;">2. 10 TIÊU ĐỀ ĐỀ XUẤT (TITLE)</h2>
        <ul style="padding-left: 20px; margin: 0;">
          ${pack.result.titles.map(t => `<li style="margin-bottom: 8px; font-size: 15px;">${escapeHtml(t)}</li>`).join("")}
        </ul>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 1px solid #cccccc; padding-bottom: 8px; margin-bottom: 15px; color: #000000;">3. MÔ TẢ CHUẨN SEO (DESCRIPTION)</h2>
        <div style="padding: 15px; border: 1px solid #dddddd; border-radius: 4px; background-color: #fafafa; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${escapeHtml(pack.result.description)}</div>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 1px solid #cccccc; padding-bottom: 8px; margin-bottom: 15px; color: #000000;">4. THẺ TỪ KHÓA & HASHTAG (TAGS)</h2>
        <p style="margin: 5px 0 10px 0;"><strong>Hashtag:</strong> <span style="color: #0056b3;">${pack.result.hashtags.join(" ")}</span></p>
        <p style="margin: 5px 0;"><strong>Tags (Dấu phẩy):</strong></p>
        <div style="padding: 12px; border: 1px solid #dddddd; background-color: #ffffff; font-size: 14px;">${pack.result.tags.join(", ")}</div>
      </div>
    </div>
  `;

  const opt = {
    margin:       0,
    filename:     `youtube-seo-report-${slugify(pack.input.primaryKeyword)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  showToast("Đang chuẩn bị file PDF... Quá trình này có thể mất vài giây.");

  setTimeout(() => {
    html2pdf().set(opt).from(htmlContent).save().then(() => {
      showToast("Đã tải xuống báo cáo PDF!");
    }).catch((err) => {
      showToast("Lỗi xuất PDF: " + err.message);
    });
  }, 150);
}

async function copyToClipboard(text, label = "Nội dung") {
  if (!text) {
    showToast("Không có nội dung để sao chép.");
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopy(text);
    }
    showToast(`Đã sao chép ${label}.`);
  } catch (error) {
    fallbackCopy(text);
    showToast(`Đã sao chép ${label}.`);
  }
}

function renderSeoResult(pack, includeSaveButton = false) {
  if (!pack.scoreDetails) {
    pack.score = calculateSeoScore(pack);
  }

  const result = pack.result;
  const scoreAngle = Math.round((pack.score / 100) * 360);

  return `
    <div class="result-shell">
      <div id="scoreCardContainer-${pack.id}" class="score-card content-block" style="--score-angle: ${scoreAngle}deg;">
        <div>
          <h4>Điểm SEO theo nguyên tắc chính thống</h4>
          <p class="helper-text">Ưu tiên tiêu đề, ảnh bìa, mô tả, khả năng giữ chân người xem và độ an toàn chống spam; thẻ từ khóa chỉ là tín hiệu phụ.</p>
        </div>
        <div id="scoreRing-${pack.id}" class="score-ring">${pack.score}</div>
      </div>

      <div id="scoreDetailsContainer-${pack.id}">
        ${renderScoreDetails(pack)}
      </div>


      <div class="content-block">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4>Tiêu đề chính (Live Edit)</h4>
          <button class="ghost-action" type="button" onclick="copyText(document.getElementById('liveTitle-${pack.id}').value)">Copy</button>
        </div>
        <input type="text" id="liveTitle-${pack.id}" class="input" value="${escapeHtml(result.titles[0])}" oninput="handleLiveEdit(this, 'title', '${pack.id}')">
        
        <h4 style="margin-top:16px; margin-bottom:8px;">9 tiêu đề gợi ý khác</h4>
        <div class="copy-box">
          <button class="copy-btn" onclick="copyText(this.nextElementSibling.innerText)" aria-label="Copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <div class="copy-content">${renderTitleList(result.titles.slice(1))}</div>
        </div>
      </div>

      <div class="content-block">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4>Mô tả SEO (Live Edit)</h4>
          <button class="ghost-action" type="button" onclick="copyText(document.getElementById('liveDesc-${pack.id}').value)">Copy</button>
        </div>
        <textarea id="liveDesc-${pack.id}" class="input" style="height:200px; resize:vertical;" oninput="handleLiveEdit(this, 'description', '${pack.id}')">${escapeHtml(result.description)}</textarea>
      </div>

      ${renderCopyBlock("Hashtag", "hashtags", renderChips(result.hashtags), result.hashtags.join(" "))}
      ${renderCopyBlock("Thẻ từ khóa tham khảo", "thẻ từ khóa", renderChips(result.tags), result.tags.join(", "))}

      <div class="content-block">
        <h4>Câu chữ trên ảnh bìa</h4>
        ${renderChips(result.thumbnailHooks)}
      </div>

      <div class="content-block">
        <h4>Câu mở đầu</h4>
        <ul class="title-list">
          ${result.openingHooks.map((hook) => `<li>${escapeHtml(hook)}</li>`).join("")}
        </ul>
      </div>

      ${renderCopyBlock("Bình luận ghim", "bình luận ghim", `<p>${escapeHtml(result.pinnedComment)}</p>`, result.pinnedComment)}
      ${renderCopyBlock("Mô tả video ngắn", "mô tả video ngắn", `<p>${escapeHtml(result.shortsCaption)}</p>`, result.shortsCaption)}

      <div class="content-block">
        <h4>Checklist trước khi upload</h4>
        <ul class="check-list">
          ${result.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>

      <div class="button-row">
        ${includeSaveButton ? '<button class="primary-action" type="button" data-action="save-current">Lưu bộ SEO</button>' : ""}
        <button class="ghost-action" type="button" data-action="export-pdf" data-id="${pack.id}">Xuất báo cáo TXT</button>
      </div>
    </div>
  `;
}

function renderScoreDetails(pack) {
  const details = pack.scoreDetails;
  if (!details) return "";

  return `
    <div class="content-block">
      <h4>Chi tiết điểm</h4>
      <div class="score-breakdown">
        ${details.groups.map((group) => `
          <div class="score-group">
            <div class="score-group-head">
              <strong>${escapeHtml(group.label)}</strong>
              <span>${group.score}/${group.max}</span>
            </div>
            <ul class="score-list">
              ${group.items.map((item) => `
                <li class="${item.passed ? "passed" : "failed"}">
                  <span>${item.passed ? "Đạt" : "Thiếu"}</span>
                  ${escapeHtml(item.label)}
                  <small>${item.points}/${item.max}</small>
                </li>
              `).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
      <div class="seo-source-note">
        <strong>Cơ sở đánh giá:</strong>
        <ul>
          ${seoSourceNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>
      </div>
      <div class="seo-source-note">
        <strong>Gợi ý tối ưu tiếp theo:</strong>
        <ul>
          ${details.recommendations.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderPackListItem(pack, compact = false) {
  const firstTitle = pack.result.titles[0] || pack.input.topic;
  return `
    <li class="pack-item ${compact ? 'compact' : ''}">
      <div class="pack-head" style="width: 100%;">
        <div style="flex: 1;">
          <h4 style="margin: 0; font-size: 1.05rem;">${escapeHtml(firstTitle)}</h4>
          <div class="pack-meta" style="font-size: 0.85rem; color: var(--muted); margin-top: 6px;">
            <span>${escapeHtml(pack.input.videoType)}</span>
            <span>•</span>
            <span>${escapeHtml(pack.input.primaryKeyword)}</span>
            <span>•</span>
            <span style="font-weight: 600; color: ${pack.score >= 85 ? 'var(--success)' : pack.score >= 70 ? 'var(--warning)' : 'var(--danger)'}">Điểm ${pack.score}/100</span>
          </div>
        </div>
        <div class="button-row" style="margin-top: ${compact ? '0' : '12px'};">
          <button class="ghost-action" type="button" data-action="view-pack" data-id="${pack.id}">Xem</button>
          
          <div class="dropdown">
            <button class="ghost-action" type="button" data-action="dropdown-toggle">Sao chép ▼</button>
            <div class="dropdown-menu">
              <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="title">Tiêu đề</button>
              <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="description">Mô tả</button>
              <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="hashtag">Hashtag</button>
              <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="tag">Thẻ từ khóa</button>
              <button class="dropdown-item" type="button" data-action="copy-pack-part" data-id="${pack.id}" data-part="pinned">Bình luận ghim</button>
            </div>
          </div>
          
          <button class="ghost-action" type="button" data-action="export-pdf" data-id="${pack.id}">Xuất TXT</button>

          <div class="dropdown">
            <button class="ghost-action" style="padding: 8px;" type="button" data-action="dropdown-toggle">⋯</button>
            <div class="dropdown-menu" style="right: 0; min-width: 120px;">
              <button class="dropdown-item danger" type="button" data-action="show-confirm" data-confirm-title="Xóa bộ SEO này?" data-confirm-desc="Thao tác này không thể hoàn tác." data-confirm-action="delete-pack" data-id="${pack.id}">Xóa</button>
            </div>
          </div>
        </div>
      </div>
    </li>
  `;
}

function renderKeywordGroup(group, keywords) {
  return `
    <article class="keyword-group-card">
      <div class="keyword-group-head">
        <div>
          <h4>${escapeHtml(group)}</h4>
          <p>${keywords.length} từ khóa</p>
        </div>
        <div class="dropdown">
          <button class="keyword-menu-action" type="button" data-action="dropdown-toggle">Tùy chọn</button>
          <div class="dropdown-menu" style="right: 0; min-width: 180px;">
            <button class="dropdown-item" type="button" data-action="copy-keyword-group" data-group="${escapeHtml(group)}">Sao chép tất cả từ khóa</button>
            <button class="dropdown-item danger" type="button" data-action="show-confirm" data-confirm-title="Xóa nhóm từ khóa?" data-confirm-desc="Toàn bộ từ khóa trong nhóm này sẽ bị xóa." data-confirm-action="delete-keyword-group" data-group="${escapeHtml(group)}">Xóa nhóm</button>
          </div>
        </div>
      </div>
      <div class="keyword-chip-list">
        ${keywords.length ? keywords.map((keyword) => `
          <span class="keyword-chip">
            ${escapeHtml(keyword)}
            <button type="button" aria-label="Xóa từ khóa ${escapeHtml(keyword)}" data-action="delete-keyword" data-group="${escapeHtml(group)}" data-keyword="${escapeHtml(keyword)}">×</button>
          </span>
        `).join("") : '<span class="keyword-group-empty">Nhóm này chưa có từ khóa.</span>'}
      </div>
      <form class="keyword-add-form" data-keyword-form="${escapeHtml(group)}">
        <input class="input" name="keyword" required placeholder="Thêm từ khóa mới...">
        <button class="keyword-secondary-action" type="submit">Thêm</button>
      </form>
    </article>
  `;
}

function renderCopyBlock(title, label, html, copyText) {
  return `
    <div class="content-block">
      <div class="copy-row">
        <h4>${title}</h4>
        <button class="icon-action" type="button" data-action="copy-text" data-label="${escapeHtml(label)}" data-copy="${escapeHtml(copyText)}">Sao chép</button>
      </div>
      ${html}
    </div>
  `;
}

function renderTitleList(titles) {
  return `
    <ul class="title-list">
      ${titles.map((title) => `<li>${escapeHtml(title)}</li>`).join("")}
    </ul>
  `;
}

function renderChips(items) {
  return `<div class="chip-wrap">${items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function renderStatCard(label, value, helper) {
  return `
    <section class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: var(--muted);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></span>
        <span style="font-size: 14px; color: var(--muted); font-weight: 600;">${label}</span>
      </div>
      <p style="font-size: 32px; font-weight: 700; margin: 0; color: var(--text); line-height: 1.2;">${value}</p>
      <p style="font-size: 13px; color: var(--subtle); margin: 0;">${helper}</p>
    </section>
  `;
}

function renderEmptyState(icon, title, body) {
  let svgIcon = '';
  if (title === "Chưa đủ dữ liệu") {
    svgIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; opacity: 0.5; width: 32px; height: 32px;"><path d="M4 19l16 0" /><path d="M4 15l4 -6l4 2l4 -5l4 4" /></svg>';
  } else if (title === "Chưa có bộ SEO") {
    svgIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; opacity: 0.5; width: 32px; height: 32px;"><path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" /><path d="M10 12l4 0" /></svg>';
  } else if (title === "Chưa có từ khóa") {
    svgIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; opacity: 0.5; width: 32px; height: 32px;"><path d="M3 8v4.172a2 2 0 0 0 .586 1.414l5.71 5.71a2.41 2.41 0 0 0 3.408 0l3.592 -3.592a2.41 2.41 0 0 0 0 -3.408l-5.71 -5.71a2 2 0 0 0 -1.414 -.586h-4.172a1 1 0 0 0 -1 1z" /><path d="M18 9l.275 -.275a2.427 2.427 0 0 1 3.43 0l.027 .025a2.427 2.427 0 0 1 0 3.43l-4.232 4.232" /><path d="M7 11.5l0 .01" /><path d="M3 3l18 18" /></svg>';
  } else {
    svgIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; opacity: 0.5; width: 32px; height: 32px;"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12.01" y2="8" /><polyline points="11 12 12 12 12 16 13 16" /></svg>';
  }

  return `
    <div style="padding: 32px 16px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: var(--radius-md); margin-top: 16px;">
      ${svgIcon}
      <h3 style="font-size: 15px; margin: 0 0 4px 0; color: var(--text); font-weight: 600;">${title}</h3>
      <p style="font-size: 13px; margin: 0;">${body}</p>
    </div>
  `;
}

function bindGlobalEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  window.addEventListener("hashchange", () => {
    const hashTab = location.hash.replace("#", "");
    if (tabTitles[hashTab] && hashTab !== state.activeTab) {
      state.activeTab = hashTab;
      renderActiveTab();
    }
  });

  document.getElementById("quickCreateBtn").addEventListener("click", () => setActiveTab("create"));
  document.getElementById("viewSavedBtn").addEventListener("click", () => setActiveTab("saved"));
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document.getElementById("importBackupFile").addEventListener("change", handleFileChange);

  document.getElementById("appView").addEventListener("submit", handleFormSubmit);
  document.getElementById("appView").addEventListener("click", handleViewClick);
}

function handleFileChange(event) {
  if (event.target.id === "importBackupFile") {
    importDataBackup(event);
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  if (event.target.id === "apiKeyForm") {
    const key = cleanText(new FormData(event.target).get("geminiApiKey"));
    state.geminiApiKey = key;
    if (key) {
      localStorage.setItem(STORAGE_KEYS.apiKey, key);
      showToast("Đã lưu API Key.");
    } else {
      localStorage.removeItem(STORAGE_KEYS.apiKey);
      showToast("Đã gỡ API Key. Sử dụng chế độ cơ bản.");
    }
    renderActiveTab();
    return;
  }

  if (event.target.id === "extractForm") {
    const url = cleanText(new FormData(event.target).get("youtubeLink"));
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const errorElement = document.getElementById("extractInlineError");
    const resultContainer = document.getElementById("extractResultContainer");

    if (!url) {
      errorElement.textContent = "Vui lòng dán link video YouTube.";
      return;
    }
    if (!isValidYoutubeUrl(url)) {
      errorElement.textContent = "Nội dung chưa hợp lệ. Hãy dùng link YouTube hoặc dán toàn bộ mã nguồn HTML của trang YouTube.";
      return;
    }

    errorElement.textContent = "";
    submitBtn.textContent = "Đang phân tích...";
    submitBtn.disabled = true;
    resultContainer.innerHTML = renderExtractLoadingState();

    try {
      const data = await extractYoutubeData(url);
      resultContainer.innerHTML = renderExtractResult(data);
    } catch (err) {
      resultContainer.innerHTML = renderExtractErrorState("Tính năng cần nguồn dữ liệu hợp lệ để trích xuất metadata. Hãy kiểm tra link hoặc thử lại sau.");
      showToast("Không thể phân tích video.");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
    return;
  }

    if (event.target.id === "seoForm") {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Đang tạo...";
    submitBtn.disabled = true;

    const resultContainer = document.getElementById("resultContainer");
    if (resultContainer) {
      resultContainer.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: var(--text-secondary);">
          <div style="margin-bottom: 20px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 2s linear infinite;">
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          </div>
          <strong style="display: block; font-size: 1.1rem; color: var(--text);">Đang phân tích & tạo dữ liệu...</strong>
          <p style="font-size: 0.9rem; margin-top: 8px;">Trí tuệ nhân tạo đang tổng hợp nội dung tối ưu nhất.</p>
        </div>
      `;
    }

    try {
      state.currentPack = await generateSeoPack(new FormData(event.target));
      renderActiveTab();
      showToast("Đã tạo bộ SEO.");
    } catch (error) {
      showToast("Lỗi tạo SEO: " + error.message);
      if (resultContainer) resultContainer.innerHTML = renderCreateEmptyState();
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
    return;
  }

  if (event.target.id === "keywordGroupForm") {
    addKeywordGroup(new FormData(event.target));
    event.target.reset();
    renderActiveTab();
    return;
  }

  const group = event.target.dataset.keywordForm;
  if (group) {
    addKeywordToGroup(group, new FormData(event.target).get("keyword"));
    renderActiveTab();
  }
}

function handleViewClick(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const { action, id, part, group, keyword, copy, label, tabTarget } = actionButton.dataset;

  if (action === "dropdown-toggle") {
    const menu = actionButton.nextElementSibling;
    const isShowing = menu.classList.contains("show");
    document.querySelectorAll(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
    if (!isShowing) menu.classList.add("show");
    return;
  }

  if (action === "show-confirm") {
    const title = actionButton.dataset.confirmTitle;
    const desc = actionButton.dataset.confirmDesc;
    const confirmAction = actionButton.dataset.confirmAction;
    const confirmLabel = actionButton.dataset.confirmLabel;
    
    showConfirm(title, desc, () => {
      if (confirmAction === "delete-pack") deletePack(id);
      if (confirmAction === "delete-keyword-group") deleteKeywordGroup(group);
      if (confirmAction === "import-backup") document.getElementById("importBackupFile").click();
      if (confirmAction === "factory-reset") {
        state.packs = [];
        state.keywordBank = {};
        setStoredData(STORAGE_KEYS.packs, []);
        setStoredData(STORAGE_KEYS.keywords, {});
        showToast("Đã xóa toàn bộ dữ liệu.");
        renderActiveTab();
      }
    }, confirmLabel);
    return;
  }

  if (action === "go-create") setActiveTab("create");
  if (action === "go-tab" && tabTitles[tabTarget]) setActiveTab(tabTarget);
  if (action === "install-app") installPwa();
  if (action === "toggle-api-key") {
    const input = document.getElementById("geminiApiKey");
    if (input) {
      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";
      actionButton.textContent = shouldShow ? "Ẩn" : "Hiện";
      actionButton.setAttribute("aria-label", shouldShow ? "Ẩn API key" : "Hiện API key");
    }
  }
  if (action === "clear-api-key") {
    state.geminiApiKey = "";
    localStorage.removeItem(STORAGE_KEYS.apiKey);
    showToast("Đã gỡ API Key. Sử dụng chế độ cơ bản.");
    renderActiveTab();
  }
  if (action === "save-current") savePack();
  if (action === "export-pdf") exportPackToTXT(id);
  if (action === "copy-text") copyToClipboard(copy, label);
  if (action === "view-pack") viewPack(id);
  if (action === "delete-pack") deletePack(id);
  
  if (action === "copy-pack-part") {
    const originalText = actionButton.textContent;
    actionButton.textContent = "Đã sao chép";
    setTimeout(() => { actionButton.textContent = originalText; }, 1500);
    copyPackPart(id, part);
    document.querySelectorAll(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
  }
  if (action === "copy-keyword-group") {
    copyToClipboard((state.keywordBank[group] || []).join(", "), `nhóm ${group}`);
    document.querySelectorAll(".dropdown-menu.show").forEach((menu) => menu.classList.remove("show"));
  }
  if (action === "clear-keyword-filters") {
    const search = document.getElementById("searchKeywordGroups");
    const filter = document.getElementById("keywordFilter");
    const sort = document.getElementById("keywordSort");
    if (search) search.value = "";
    if (filter) filter.value = "all";
    if (sort) sort.value = "newest";
    filterKeywordLibrary();
  }
  if (action === "focus-keyword-create") {
    document.getElementById("groupName")?.focus();
  }
  
  if (action === "delete-keyword-group") deleteKeywordGroup(group);
  if (action === "delete-keyword") deleteKeyword(group, keyword);
  if (action === "export-backup") exportDataBackup();
  if (action === "import-backup") document.getElementById("importBackupFile").click();
  if (action === "use-tags") {
    const tags = actionButton.dataset.tags;
    setActiveTab("create");
    setTimeout(() => {
      const el = document.getElementById("secondaryKeywords");
      if (el) {
        el.value = tags;
        showToast("Đã chèn Tags vào ô Từ khóa phụ.");
      }
    }, 50);
  }
}

function setActiveTab(tab) {
  state.activeTab = tab;
  if (location.hash !== `#${tab}`) {
    history.replaceState(null, "", `#${tab}`);
  }
  renderActiveTab();
}

function setInitialTabFromHash() {
  const hashTab = location.hash.replace("#", "");
  if (tabTitles[hashTab]) {
    state.activeTab = hashTab;
  }
}

function renderActiveTab() {
  const appView = document.getElementById("appView");
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const viewSavedButton = document.getElementById("viewSavedBtn");
  const quickCreateButton = document.getElementById("quickCreateBtn");

  const tabSubtitles = {
    dashboard: "Theo dõi bộ SEO, điểm tối ưu, từ khóa và nội dung cần cải thiện.",
    create: "Phân tích và tối ưu hóa metadata cho video của bạn.",
    saved: "Quản lý và sử dụng lại các bộ SEO đã lưu.",
    keywords: "Tổ chức từ khóa theo ngách để tối ưu hàng loạt.",
    extract: "Trích xuất metadata từ video YouTube để tham khảo tiêu đề, mô tả, hashtag và từ khóa.",
    settings: "Quản lý cấu hình AI, sao lưu dữ liệu và thông tin ứng dụng."
  };

  pageTitle.textContent = tabTitles[state.activeTab];
  if (pageSubtitle) {
    pageSubtitle.textContent = tabSubtitles[state.activeTab] || "";
  }
  const mainContent = document.querySelector(".main-content");
  mainContent.classList.toggle("dashboard-active", state.activeTab === "dashboard");
  mainContent.classList.toggle("create-active", state.activeTab === "create");
  mainContent.classList.toggle("saved-active", state.activeTab === "saved");
  mainContent.classList.toggle("keywords-active", state.activeTab === "keywords");
  mainContent.classList.toggle("extract-active", state.activeTab === "extract");
  mainContent.classList.toggle("settings-active", state.activeTab === "settings");
  viewSavedButton.classList.toggle("hidden", state.activeTab !== "create");
  quickCreateButton.classList.toggle("hidden", ["create", "keywords", "extract", "settings"].includes(state.activeTab));
  appView.innerHTML = {
    dashboard: renderDashboard,
    create: renderCreateForm,
    saved: renderSavedPacks,
    keywords: renderKeywordBank,
    extract: renderExtract,
    settings: renderSettings
  }[state.activeTab]();

  syncNavState();
  updateInstallControls();

  if (state.activeTab === "dashboard" && typeof Chart !== "undefined") {
    renderCharts();
  }

  if (state.activeTab === "create") {
    setupCustomDropdown();
  }
}

function syncNavState() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    const isActive = button.dataset.tab === state.activeTab;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function viewPack(id) {
  const pack = state.packs.find((item) => item.id === id);
  if (!pack) return;

  state.currentPack = pack;
  setActiveTab("create");
  showToast("Đã mở lại bộ SEO.");
}

function deletePack(id) {
  state.packs = state.packs.filter((pack) => pack.id !== id);
  setStoredData(STORAGE_KEYS.packs, state.packs);
  showToast("Đã xóa bộ SEO.");
  renderActiveTab();
}

function copyPackPart(id, part) {
  const pack = state.packs.find((item) => item.id === id);
  if (!pack) return;

  const map = {
    title: pack.result.titles.join("\n"),
    description: pack.result.description,
    hashtag: pack.result.hashtags.join(" "),
    tag: pack.result.tags.join(", "),
    pinned: pack.result.pinnedComment
  };

  copyToClipboard(map[part], part);
}

function addKeywordGroup(formData) {
  const groupName = cleanText(formData.get("groupName"));
  const keywords = splitKeywords(formData.get("groupKeywords"));

  if (!groupName) return;
  if (state.keywordBank[groupName]) {
    showToast("Tên nhóm này đã tồn tại.");
    return;
  }
  state.keywordBank[groupName] = Array.from(new Set([...(state.keywordBank[groupName] || []), ...keywords]));
  setStoredData(STORAGE_KEYS.keywords, state.keywordBank);
  showToast("Đã tạo nhóm từ khóa.");
}

function addKeywordToGroup(group, keyword) {
  const cleanKeyword = cleanText(keyword);
  if (!cleanKeyword) return;

  state.keywordBank[group] = Array.from(new Set([...(state.keywordBank[group] || []), cleanKeyword]));
  setStoredData(STORAGE_KEYS.keywords, state.keywordBank);
  showToast("Đã thêm từ khóa.");
}

function deleteKeywordGroup(group) {
  delete state.keywordBank[group];
  setStoredData(STORAGE_KEYS.keywords, state.keywordBank);
  showToast("Đã xóa nhóm từ khóa.");
  renderActiveTab();
}

function deleteKeyword(group, keyword) {
  state.keywordBank[group] = (state.keywordBank[group] || []).filter((item) => item !== keyword);
  setStoredData(STORAGE_KEYS.keywords, state.keywordBank);
  showToast("Đã xóa từ khóa.");
  renderActiveTab();
}

function createScoreItem(label, condition, max) {
  return {
    label,
    max,
    points: condition ? max : 0,
    passed: Boolean(condition)
  };
}

async function extractYoutubeData(inputData) {
  let title = "Không rõ tiêu đề";
  let description = "Không có mô tả";
  let image = "";
  let tags = [];

  const isHtml = inputData.trim().startsWith('<') || inputData.toLowerCase().includes('<meta');

  function getFullDescription(htmlStr) {
    const match = htmlStr.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
    if (match && match[1]) {
      return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    return null;
  }

  if (isHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(inputData, "text/html");

    title = doc.querySelector('meta[property="og:title"]')?.content || doc.querySelector('title')?.textContent || title;
    description = getFullDescription(inputData) || doc.querySelector('meta[property="og:description"]')?.content || doc.querySelector('meta[name="description"]')?.content || description;
    image = doc.querySelector('meta[property="og:image"]')?.content || image;
    tags = Array.from(doc.querySelectorAll('meta[property="og:video:tag"]')).map(tag => tag.content);
    
    if (tags.length === 0) {
      const keywordsMeta = doc.querySelector('meta[name="keywords"]')?.content;
      if (keywordsMeta) {
        tags = keywordsMeta.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    return { title, description, image, tags };
  }

  const url = inputData;
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!data.contents) throw new Error();

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, "text/html");

    // Check if it's a captcha/error page
    if (doc.title.toLowerCase().includes("robot") || doc.title.toLowerCase().includes("captcha")) {
      throw new Error();
    }

    title = doc.querySelector('meta[property="og:title"]')?.content || doc.title || title;
    description = getFullDescription(data.contents) || doc.querySelector('meta[property="og:description"]')?.content || doc.querySelector('meta[name="description"]')?.content || description;
    image = doc.querySelector('meta[property="og:image"]')?.content || image;
    tags = Array.from(doc.querySelectorAll('meta[property="og:video:tag"]')).map(tag => tag.content);
  } catch (err) {
    // Fallback to official oEmbed API if proxy is blocked
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const oResponse = await fetch(oembedUrl);
      if (!oResponse.ok) throw new Error();
      const oData = await oResponse.json();
      
      title = oData.title || title;
      image = oData.thumbnail_url || image;
      description = "Hệ thống tự động đang bị YouTube chặn.\n👉 MẸO: Hãy nhấn Ctrl+U ở trang YouTube, copy toàn bộ mã nguồn và dán vào ô bên trên để lấy full dữ liệu!";
    } catch (fallbackErr) {
      throw new Error("Không thể trích xuất video này. Link có thể không hợp lệ hoặc bị chặn hoàn toàn.");
    }
  }

  return { title, description, image, tags };
}

function createSeoRecommendations(groups) {
  const failedItems = groups
    .flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
    .filter((item) => !item.passed)
    .slice(0, 5);

  if (!failedItems.length) {
    return [
      "Bộ SEO đã có cấu trúc rất mạnh. Sau khi đăng, hãy theo dõi tỷ lệ nhấp và tỷ lệ giữ chân trong 24 giờ đầu để tối ưu tiếp.",
      "Nếu tỷ lệ nhấp thấp, hãy thử lại ảnh bìa hoặc tiêu đề. Nếu tỷ lệ giữ chân thấp, hãy tối ưu 30 giây mở đầu."
    ];
  }

  return failedItems.map((item) => `${item.group}: ${item.label}`);
}

function hasSpamSignals(text) {
  const value = String(text || "");
  const letters = value.replace(/[^A-Za-zÀ-ỹĐđ]/g, "");
  const uppercaseLetters = value.replace(/[^A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠ-Ỵ]/g, "");
  const uppercaseRatio = letters.length ? uppercaseLetters.length / letters.length : 0;
  const hasTooMuchPunctuation = /[!?]{3,}/.test(value);
  const hasTooManyEmoji = (value.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length > 2;
  const hasTooManyHashtags = (value.match(/#/g) || []).length > 3;

  return uppercaseRatio > 0.62 || hasTooMuchPunctuation || hasTooManyEmoji || hasTooManyHashtags;
}

function getKeywordDensity(text, keyword) {
  const words = getWordCount(text);
  if (!words || !keyword) return 0;

  const occurrences = countOccurrences(text.toLowerCase(), keyword.toLowerCase());
  return Number(((occurrences / words) * 100).toFixed(2));
}

function countOccurrences(text, keyword) {
  if (!keyword) return 0;
  return text.split(keyword).length - 1;
}

function getWordCount(text) {
  return String(text || "").split(/\s+/).filter(Boolean).length;
}

function createTitles({ topic, videoType, primaryKeyword, tone }) {
  const toneTail = {
    "Tự nhiên": "góc nhìn thật nhất",
    "Hài hước": "và kết quả khá bất ngờ",
    "Điện ảnh": "một trải nghiệm rất điện ảnh",
    "Chuyên nghiệp": "phân tích ngắn gọn, dễ hiểu",
    "Gen Z": "liệu có flex được không"
  }[tone] || "góc nhìn thật nhất";

  const typeTemplates = {
    "Nhật ký cá nhân": `${primaryKeyword}: một ngày trải nghiệm thật`,
    "Đánh giá ẩm thực": `Đánh giá ${primaryKeyword}: có đáng thử không?`,
    "Trò chơi": `${primaryKeyword}: trải nghiệm thực tế và kết quả`,
    "Bóng đá": `${primaryKeyword}: nhận định dễ hiểu trước trận`,
    "Phỏng vấn / trò chuyện": `${primaryKeyword}: cuộc trò chuyện nên nghe một lần`,
    "Hướng dẫn": `${primaryKeyword}: cách làm dễ hiểu từ đầu`,
    "Khác": `${primaryKeyword}: sự thật có như lời đồn?`
  };

  return [
    typeTemplates[videoType] || `${primaryKeyword} có đáng thử không?`,
    `${primaryKeyword}: điều cần biết trước khi xem`,
    `Tôi đã thử ${topic} và kết quả bất ngờ`,
    `${topic}: sự thật có như lời đồn?`,
    `Một ngày trải nghiệm ${topic}`,
    `Đừng làm ${topic} trước khi xem video này`,
    `${primaryKeyword}: ${toneTail}`,
    `5 điều cần biết về ${primaryKeyword}`,
    `${topic} có thật sự hợp với bạn?`,
    `Review nhanh ${primaryKeyword}: đáng xem hay nên bỏ qua?`
  ].map((title) => limitTitleLength(title, 70));
}

function createDescription({ topic, videoType, primaryKeyword, secondaryKeywords, audience, tone, hashtags }) {
  const secondaryText = secondaryKeywords.length
    ? `Trong video, mình cũng nhắc tự nhiên tới ${joinNaturally(secondaryKeywords)} để bạn có thêm góc nhìn đầy đủ hơn.`
    : "Mình giữ cách kể tự nhiên, không cố nhồi từ khóa để video vẫn dễ xem và dễ hiểu.";

  const toneLine = {
    "Tự nhiên": "Giọng điệu của video nhẹ nhàng, gần gũi và tập trung vào trải nghiệm thật.",
    "Hài hước": "Video có vài đoạn vui vừa đủ để giữ nhịp xem thoải mái.",
    "Điện ảnh": "Nội dung ưu tiên cảm giác điện ảnh, nhịp dựng gọn và hình ảnh có không khí.",
    "Chuyên nghiệp": "Nội dung được sắp xếp rõ ràng để bạn dễ nắm ý chính và tự ra quyết định.",
    "Gen Z": "Cách kể sẽ nhanh, gọn, bắt trend vừa đủ nhưng không bị quá đà."
  }[tone];

  return `${primaryKeyword} là trọng tâm của video hôm nay.\nNếu bạn đang quan tâm đến ${primaryKeyword}, video này sẽ giúp bạn nhìn rõ hơn qua chủ đề ${topic}.\n\n${videoType} này dành cho ${audience}. ${secondaryText} ${toneLine} Mục tiêu là giúp bạn có thêm thông tin trước khi thử, xem, mua, chơi hoặc áp dụng điều được nói trong video.\n\nNếu thấy nội dung hữu ích, hãy nhấn thích video, để lại bình luận quan điểm của bạn và đăng ký kênh để mình có động lực làm thêm nhiều video chất lượng hơn. Bạn cũng có thể để lại câu hỏi bên dưới, mình sẽ đọc và phản hồi trong các video tiếp theo.\n\n${hashtags.join(" ")}`;
}

function createHashtags(primaryKeyword, secondaryKeywords, videoType) {
  const base = [primaryKeyword, secondaryKeywords[0], videoType]
    .filter(Boolean)
    .map((item) => `#${removeVietnameseTones(item).replace(/[^a-zA-Z0-9]+/g, "")}`)
    .filter((item) => item.length > 1);

  return Array.from(new Set(base)).slice(0, 3);
}

function createTags({ topic, videoType, primaryKeyword, secondaryKeywords, audience }) {
  const tagSeeds = [
    primaryKeyword,
    ...secondaryKeywords,
    topic,
    videoType,
    `${primaryKeyword} đánh giá`,
    `${primaryKeyword} trải nghiệm`,
    `${primaryKeyword} có đáng thử`,
    `${primaryKeyword} cho người mới`,
    `${topic} thực tế`,
    `${videoType} Việt Nam`,
    audience,
    "youtube việt nam",
    "nhà sáng tạo nội dung việt nam",
    "video hay",
    "kinh nghiệm thực tế",
    "đánh giá chân thật"
  ];

  return Array.from(new Set(tagSeeds.map(cleanText).filter(Boolean))).slice(0, 15);
}

function createThumbnailHooks(tone) {
  const base = ["CÓ ĐÁNG THỬ?", "BẤT NGỜ THẬT", "KHÔNG NHƯ TÔI NGHĨ", "QUÁ ỔN?", "LẦN ĐẦU THỬ"];
  const toneExtra = {
    "Hài hước": ["BẤT NGỜ THẬT", "KHÓ TIN"],
    "Điện ảnh": ["ĐẸP NHƯ PHIM", "QUÁ CUỐN"],
    "Chuyên nghiệp": ["ĐÁNG ĐỂ XEM", "SỰ THẬT"],
    "Gen Z": ["ỔN ÁP KHÔNG?", "KEO THẬT"],
    "Tự nhiên": ["THẬT SỰ ỔN?", "NÊN THỬ?"]
  }[tone] || [];

  return [...toneExtra, ...base].slice(0, 5);
}

function createOpeningHooks({ topic, primaryKeyword, audience, tone }) {
  const intro = tone === "Gen Z" ? "Nói thật nha" : "Nói thật";
  return [
    `${intro}, mình không nghĩ ${primaryKeyword} lại cho cảm giác như thế này.`,
    `Nếu bạn là ${audience}, hãy xem phần đầu video trước khi quyết định về ${topic}.`,
    `Mình sẽ test ${topic} theo cách thực tế nhất, không tâng bốc và không dìm hàng.`
  ];
}

function createPinnedComment(primaryKeyword, audience, tone) {
  const ending = tone === "Hài hước" ? "Mình sẽ đọc bình luận để lấy ý tưởng cho tập tiếp theo." : "Mình sẽ đọc bình luận để làm nội dung tiếp theo.";
  return `Bạn nghĩ ${primaryKeyword} có đáng thử với ${audience} không? Comment góc nhìn của bạn bên dưới nhé. ${ending}`;
}

function createShortsCaption(primaryKeyword, topic, hashtags) {
  return `${primaryKeyword} trong 30 giây: điểm đáng chú ý nhất từ ${topic}. Xem video đầy đủ để biết kết quả cuối cùng. ${hashtags.slice(0, 2).join(" ")}`;
}

function formatPackForText(pack) {
  if (!pack.scoreDetails) {
    pack.score = calculateSeoScore(pack);
  }

  const result = pack.result;
  return [
    "Youtube SEO Tools - Bộ SEO",
    `Thời gian tạo: ${new Date(pack.createdAt).toLocaleString("vi-VN")}`,
    `Chủ đề: ${pack.input.topic}`,
    `Loại video: ${pack.input.videoType}`,
    `Từ khóa chính: ${pack.input.primaryKeyword}`,
    `Từ khóa phụ: ${pack.input.secondaryKeywords.join(", ") || "Không có"}`,
    `Đối tượng xem: ${pack.input.audience}`,
    `Giọng điệu: ${pack.input.tone}`,
    `Điểm SEO: ${pack.score}/100`,
    "",
    "CHI TIẾT ĐIỂM",
    ...pack.scoreDetails.groups.map((group) => `${group.label}: ${group.score}/${group.max}`),
    "",
    "CƠ SỞ ĐÁNH GIÁ",
    ...seoSourceNotes.map((note) => `- ${note}`),
    "",
    "GỢI Ý TỐI ƯU TIẾP THEO",
    ...pack.scoreDetails.recommendations.map((note) => `- ${note}`),
    "",
    "TIÊU ĐỀ",
    ...result.titles.map((title, index) => `${index + 1}. ${title}`),
    "",
    "MÔ TẢ",
    result.description,
    "",
    "HASHTAG",
    result.hashtags.join(" "),
    "",
    "THẺ TỪ KHÓA",
    result.tags.join(", "),
    "",
    "CÂU CHỮ TRÊN ẢNH BÌA",
    result.thumbnailHooks.join(" | "),
    "",
    "CÂU MỞ ĐẦU",
    ...result.openingHooks.map((hook, index) => `${index + 1}. ${hook}`),
    "",
    "BÌNH LUẬN GHIM",
    result.pinnedComment,
    "",
    "MÔ TẢ VIDEO NGẮN",
    result.shortsCaption,
    "",
    "DANH SÁCH KIỂM TRA",
    ...result.checklist.map((item) => `- ${item}`)
  ].join("\n");
}

function getMostUsedKeyword() {
  const counts = state.packs.reduce((map, pack) => {
    const keyword = pack.input.primaryKeyword;
    map[keyword] = (map[keyword] || 0) + 1;
    return map;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const shouldUseDark = savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.classList.toggle("dark", shouldUseDark);
  updateThemeButton();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem(STORAGE_KEYS.theme, document.body.classList.contains("dark") ? "dark" : "light");
  updateThemeButton();
}

function updateThemeButton() {
  const isDark = document.body.classList.contains("dark");
  document.getElementById("themeIcon").innerHTML = isDark
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" /><path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" /><path d="M19 11h2m-1 -1v2" /></svg>';
  document.getElementById("themeText").textContent = isDark ? "Chế độ sáng" : "Chế độ tối";
  document.getElementById("themeToggle").setAttribute("aria-pressed", String(isDark));
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#0f0f0f" : "#ff0033");
}

function bindPwaEvents() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    state.canInstall = true;
    updateInstallControls();
  });

  window.addEventListener("appinstalled", () => {
    state.deferredInstallPrompt = null;
    state.canInstall = false;
    state.isInstalled = true;
    updateInstallControls();
    showToast("Đã cài ứng dụng thành công.");
  });

  window.addEventListener("online", () => {
    state.isOnline = true;
    updateInstallControls();
    if (state.activeTab === "settings") {
      renderActiveTab();
    }
  });

  window.addEventListener("offline", () => {
    state.isOnline = false;
    updateInstallControls();
    if (state.activeTab === "settings") {
      renderActiveTab();
    }
  });
}

function updateInstallControls() {
  if (state.activeTab === "settings") {
    renderActiveTab();
  }
}

async function installPwa() {
  if (!state.deferredInstallPrompt) {
    showToast(state.isInstalled ? "Ứng dụng đã được cài rồi." : "Trình duyệt chưa cho phép cài đặt lúc này.");
    return;
  }

  state.deferredInstallPrompt.prompt();
  const choiceResult = await state.deferredInstallPrompt.userChoice;
  if (choiceResult.outcome === "accepted") {
    showToast("Đang hoàn tất cài đặt ứng dụng...");
  }

  state.deferredInstallPrompt = null;
  state.canInstall = false;
  updateInstallControls();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.warn("Service worker chưa sẵn sàng trên môi trường này:", err);
    });
  });
}


function getStoredData(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (error) {
    return fallback;
  }
}

function setStoredData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function copyText(text) {
  copyToClipboard(text);
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function splitKeywords(value) {
  return String(value || "")
    .split(",")
    .map(cleanText)
    .filter(Boolean);
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function joinNaturally(items) {
  if (items.length <= 1) return items[0] || "";
  return `${items.slice(0, -1).join(", ")} và ${items.at(-1)}`;
}

function limitTitleLength(title, maxLength = 70) {
  if (title.length <= maxLength) return title;
  return `${title.slice(0, maxLength - 3).trim()}...`;
}

function slugify(text) {
  return removeVietnameseTones(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "seo-pack";
}

function removeVietnameseTones(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function isRunningStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function createThumbnailPlaceholder() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 338">
      <rect width="600" height="338" rx="28" fill="#202020"/>
      <rect x="26" y="26" width="548" height="286" rx="18" fill="#2f2f2f" stroke="#4b5563" stroke-width="2" stroke-dasharray="10 8"/>
      <text x="300" y="154" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700">Them thumbnail</text>
      <text x="300" y="196" text-anchor="middle" fill="#cbd5e1" font-family="Segoe UI, Arial, sans-serif" font-size="18">Nhap URL hinh xem truoc</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function exportDataBackup() {
  const backupData = {
    packs: state.packs,
    keywordBank: state.keywordBank,
    exportedAt: new Date().toISOString(),
    version: "1.0"
  };
  
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `youtube-seo-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Đã xuất file sao lưu dữ liệu.");
}

function importDataBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.packs && data.keywordBank) {
        state.packs = data.packs;
        state.keywordBank = data.keywordBank;
        setStoredData(STORAGE_KEYS.packs, state.packs);
        setStoredData(STORAGE_KEYS.keywords, state.keywordBank);
        showToast("Khôi phục dữ liệu thành công!");
        renderActiveTab();
      } else {
        showToast("File sao lưu không đúng định dạng.");
      }
    } catch (error) {
      showToast("Lỗi khi đọc file sao lưu.");
    }
  };
  reader.readAsText(file);
}

function filterSavedLibrary() {
  const query = document.getElementById("searchSavedPacks")?.value || "";
  const filter = document.getElementById("savedFilter")?.value || "all";
  const sort = document.getElementById("savedSort")?.value || "newest";
  const q = query.trim().toLocaleLowerCase("vi-VN");
  const list = document.getElementById('savedPackList');
  if (!list) return;

  const now = Date.now();
  const recentThreshold = now - (30 * 24 * 60 * 60 * 1000);
  const filteredPacks = state.packs.filter((pack) => {
    const searchableText = [
      pack.input?.topic,
      pack.input?.primaryKeyword,
      pack.input?.videoCategory,
      pack.input?.categoryVi,
      pack.input?.contentNiche,
      ...(pack.input?.secondaryKeywords || [])
    ].filter(Boolean).join(" ").toLocaleLowerCase("vi-VN");
    const matchesQuery = !q || searchableText.includes(q);
    const score = Number(pack.score || 0);
    const matchesFilter = filter === "all"
      || (filter === "high" && score >= 85)
      || (filter === "optimize" && score < 70)
      || (filter === "recent" && new Date(pack.createdAt).getTime() >= recentThreshold);
    return matchesQuery && matchesFilter;
  });

  filteredPacks.sort((firstPack, secondPack) => {
    if (sort === "oldest") return new Date(firstPack.createdAt) - new Date(secondPack.createdAt);
    if (sort === "score-high") return Number(secondPack.score || 0) - Number(firstPack.score || 0);
    if (sort === "score-low") return Number(firstPack.score || 0) - Number(secondPack.score || 0);
    return new Date(secondPack.createdAt) - new Date(firstPack.createdAt);
  });

  list.innerHTML = filteredPacks.length
    ? filteredPacks.map(renderSavedSeoCard).join("")
    : renderSavedEmptyState(Boolean(state.packs.length));

  const resultCount = document.getElementById("savedResultCount");
  if (resultCount) {
    resultCount.textContent = filteredPacks.length === state.packs.length
      ? `${state.packs.length} bộ SEO đã lưu trên trình duyệt này.`
      : `${filteredPacks.length} kết quả phù hợp.`;
  }
}

function filterPacks() {
  filterSavedLibrary();
}

function filterKeywordLibrary() {
  const query = document.getElementById("searchKeywordGroups")?.value || "";
  const filter = document.getElementById("keywordFilter")?.value || "all";
  const sort = document.getElementById("keywordSort")?.value || "newest";
  const q = query.trim().toLocaleLowerCase("vi-VN");
  const list = document.getElementById('keywordGroupList');
  if (!list) return;

  const allGroups = Object.entries(state.keywordBank);
  const manyThreshold = allGroups.length
    ? Math.max(2, Math.ceil(allGroups.reduce((total, [, keywords]) => total + keywords.length, 0) / allGroups.length))
    : 2;
  const filteredGroups = allGroups.filter(([group, keywords], index) => {
    const matchesQuery = !q || group.toLocaleLowerCase("vi-VN").includes(q)
      || keywords.some((keyword) => keyword.toLocaleLowerCase("vi-VN").includes(q));
    const matchesFilter = filter === "all"
      || (filter === "many" && keywords.length >= manyThreshold)
      || (filter === "recent" && index >= Math.max(0, allGroups.length - 3))
      || (filter === "empty" && keywords.length === 0);
    return matchesQuery && matchesFilter;
  });

  filteredGroups.sort((firstGroup, secondGroup) => {
    if (sort === "az") return firstGroup[0].localeCompare(secondGroup[0], "vi");
    if (sort === "most") return secondGroup[1].length - firstGroup[1].length;
    if (sort === "least") return firstGroup[1].length - secondGroup[1].length;
    return allGroups.indexOf(secondGroup) - allGroups.indexOf(firstGroup);
  });

  list.innerHTML = filteredGroups.length
    ? filteredGroups.map(([group, keywords]) => renderKeywordGroup(group, keywords)).join("")
    : renderKeywordLibraryEmpty(Boolean(allGroups.length));

  const resultCount = document.getElementById("keywordResultCount");
  if (resultCount) {
    resultCount.textContent = filteredGroups.length === allGroups.length
      ? `${allGroups.length} nhóm đang được lưu trên trình duyệt này.`
      : `${filteredGroups.length} nhóm phù hợp.`;
  }
}

function filterKeywords() {
  filterKeywordLibrary();
}

let confirmCallback = null;
function showConfirm(title, desc, callback, confirmLabel = "Xác nhận") {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmDesc').textContent = desc;
  document.getElementById('confirmAcceptBtn').textContent = confirmLabel;
  confirmCallback = callback;
  document.getElementById('confirmModal').classList.add('show');
}

document.getElementById('confirmCancelBtn')?.addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('show');
});

document.getElementById('confirmAcceptBtn')?.addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('show');
  if (confirmCallback) confirmCallback();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
  }
});



function handleLiveEdit(element, field, packId) {
  let pack = state.packs.find(p => p.id === packId);
  if (!pack && state.currentPack && state.currentPack.id === packId) {
    pack = state.currentPack;
  }
  if (!pack) return;

  if (field === 'title') {
    pack.result.titles[0] = element.value;
    const ytPreviewTitle = document.getElementById(`ytPreviewTitle-${packId}`);
    if (ytPreviewTitle) {
      ytPreviewTitle.innerText = element.value || 'Tiêu đề video';
    }
  } else if (field === 'description') {
    pack.result.description = element.value;
  }

  // Recalculate score
  pack.score = calculateSeoScore(pack);

  // Update Score Card
  const scoreCardContainer = document.getElementById(`scoreCardContainer-${packId}`);
  const scoreRing = document.getElementById(`scoreRing-${packId}`);
  if (scoreCardContainer && scoreRing) {
    const scoreAngle = Math.round((pack.score / 100) * 360);
    scoreCardContainer.style.setProperty('--score-angle', `${scoreAngle}deg`);
    scoreRing.innerText = pack.score;
  }

  // Update Score Details
  const detailsContainer = document.getElementById(`scoreDetailsContainer-${packId}`);
  if (detailsContainer) {
    detailsContainer.innerHTML = renderScoreDetails(pack);
  }
}

async function runAICluster() {
  if (!state.geminiApiKey) {
    showToast("Vui lòng nhập API Key Gemini trong phần Cài đặt trước!");
    return;
  }
  const rawInput = document.getElementById("rawClusterInput").value.trim();
  if (!rawInput) {
    showToast("Vui lòng dán danh sách từ khóa vào.");
    return;
  }

  const btn = document.getElementById("runClusterBtn");
  const originalText = btn.innerText;
  btn.innerText = "Đang xử lý...";
  btn.disabled = true;

  try {
    const prompt = `Dưới đây là một danh sách các từ khóa ngẫu nhiên. Hãy đọc hiểu và phân loại chúng vào các nhóm ngách (Category) phù hợp nhất.
Chỉ trả về JSON hợp lệ theo định dạng {"Tên ngách 1": ["từ 1", "từ 2"], "Tên ngách 2": ["từ 3"]}.
KHÔNG giải thích thêm.

Danh sách từ khóa:
${rawInput}`;

    let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${state.geminiApiKey}`;
    let headers = { 
      "Content-Type": "application/json"
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) throw new Error("Lỗi API Gemini");

    const data = await response.json();
    const jsonText = data.candidates[0].content.parts[0].text;
    const resultObj = JSON.parse(jsonText);

    // Merge into keywordBank
    let addedCount = 0;
    for (const [groupName, keywords] of Object.entries(resultObj)) {
      if (!state.keywordBank[groupName]) {
        state.keywordBank[groupName] = [];
      }
      for (const kw of keywords) {
        if (!state.keywordBank[groupName].includes(kw)) {
          state.keywordBank[groupName].push(kw);
          addedCount++;
        }
      }
    }

    setStoredData(STORAGE_KEYS.keywords, state.keywordBank);
    showToast(`Đã gom nhóm thành công ${addedCount} từ khóa mới!`);
    document.getElementById("rawClusterInput").value = "";
    document.getElementById("clusterModal").classList.remove("active");
    renderActiveTab();
  } catch (err) {
    showToast("Gom nhóm thất bại, vui lòng thử lại.");
    console.error(err);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

let chartInstances = [];

function renderCharts() {
  // Destroy old charts to prevent memory leak / overlap
  chartInstances.forEach(chart => chart.destroy());
  chartInstances = [];

  const scoreCtx = document.getElementById('scoreChart');
  const keywordCtx = document.getElementById('keywordChart');
  if (!scoreCtx || !keywordCtx) return;

  const isDark = document.body.classList.contains("dark");
  const textColor = isDark ? "#e1e1e1" : "#111111";
  const gridColor = isDark ? "#333333" : "#eaeaea";

  Chart.defaults.color = textColor;
  Chart.defaults.font.family = "'Quicksand', sans-serif";

  // Score Distribution Chart
  const ranges = { "Yếu (<70)": 0, "Khá (70-85)": 0, "Tốt (85+)": 0 };
  state.packs.forEach(p => {
    if (p.score < 70) ranges["Yếu (<70)"]++;
    else if (p.score <= 85) ranges["Khá (70-85)"]++;
    else ranges["Tốt (85+)"]++;
  });

  const scoreChart = new Chart(scoreCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(ranges),
      datasets: [{
        label: 'Số lượng Bộ SEO',
        data: Object.values(ranges),
        backgroundColor: ['#ff4d4f', '#faad14', '#52c41a'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: gridColor } },
        x: { grid: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // Keyword Group Chart
  const kwGroups = Object.keys(state.keywordBank);
  const kwCounts = kwGroups.map(g => state.keywordBank[g].length);
  
  const keywordChart = new Chart(keywordCtx, {
    type: 'doughnut',
    data: {
      labels: kwGroups.length ? kwGroups : ["Chưa có"],
      datasets: [{
        data: kwCounts.length ? kwCounts : [1],
        backgroundColor: kwGroups.length ? ['#ff0033', '#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'] : ['#555']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'right' }
      }
    }
  });

  chartInstances.push(scoreChart, keywordChart);
}
