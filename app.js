// 37명의 대상자 명단 (가나다 순 정렬)
const PEOPLE_NAMES = [
  "강승진", "국민우", "권은진", "금명구", "김동현", 
  "김민성", "김보균", "김성근", "김수환", "김재환", 
  "김지수", "김호영", "남궁곤", "남준우", "문원주", 
  "민성경", "박경열", "박대현", "박병주", "박상수", 
  "박정진", "박정현", "박치완", "서일훈", "신형록", 
  "양덕모", "유진혁", "이인혜", "임준석", "전영우", 
  "정락준", "정우영", "최서현", "허재원", "허정민", 
  "홍정웅", "홍형순"
];

// 애플리케이션 상태 객체
const state = {
  people: PEOPLE_NAMES.map((name, index) => ({
    id: index,
    name: name,
    received: false
  })),
  isAdminMode: false,
  currentFilter: 'all', // 'all', 'received', 'pending'
  searchQuery: ''
};

// 1. 상태 인코딩 알고리즘 (37개 boolean 배열 -> 10자리 16진수 문자열)
function encodeState(peopleArray) {
  let binaryStr = peopleArray.map(p => p.received ? '1' : '0').join('');
  // 40비트로 채우기 위해 뒤에 3비트 '0' 패딩 추가 (37비트 + 3비트 = 40비트)
  binaryStr = binaryStr.padEnd(40, '0');
  
  let hexStr = '';
  for (let i = 0; i < binaryStr.length; i += 4) {
    const chunk = binaryStr.substring(i, i + 4);
    hexStr += parseInt(chunk, 2).toString(16);
  }
  return hexStr;
}

// 2. 상태 디코딩 알고리즘 (10자리 16진수 문자열 -> 37개 boolean 배열)
function decodeState(hexStr) {
  if (!hexStr || hexStr.length !== 10) {
    return new Array(PEOPLE_NAMES.length).fill(false);
  }
  
  let binaryStr = '';
  for (let i = 0; i < hexStr.length; i++) {
    const hexChar = hexStr[i];
    const parsed = parseInt(hexChar, 16);
    if (isNaN(parsed)) {
      return new Array(PEOPLE_NAMES.length).fill(false);
    }
    binaryStr += parsed.toString(2).padStart(4, '0');
  }
  
  const receivedArray = [];
  for (let i = 0; i < PEOPLE_NAMES.length; i++) {
    receivedArray.push(binaryStr[i] === '1');
  }
  return receivedArray;
}

// 3. UI 렌더링 함수
function renderApp() {
  const gridContainer = document.getElementById('people-grid');
  gridContainer.innerHTML = '';

  // 관리자 모드 클래스 바인딩
  if (state.isAdminMode) {
    gridContainer.classList.add('admin-mode');
  } else {
    gridContainer.classList.remove('admin-mode');
  }

  // 필터 및 검색 적용
  const filteredPeople = state.people.filter(person => {
    // 검색어 매칭
    const matchesSearch = person.name.includes(state.searchQuery);
    
    // 탭 필터 매칭
    let matchesFilter = true;
    if (state.currentFilter === 'received') {
      matchesFilter = person.received;
    } else if (state.currentFilter === 'pending') {
      matchesFilter = !person.received;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (filteredPeople.length === 0) {
    gridContainer.innerHTML = `
      <div class="glass-panel" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin: 0 auto 12px; display: block; color: var(--color-primary);"></i>
        <p style="font-weight: 600; font-size: 1.1rem; margin-bottom: 4px;">검색 조건에 맞는 대상자가 없습니다.</p>
        <p style="font-size: 0.9rem;">이름을 올바르게 입력했는지 혹은 필터 탭을 확인해 주세요.</p>
      </div>
    `;
    lucide.createIcons();
    updateDashboardStats();
    return;
  }

  // 카드 렌더링
  filteredPeople.forEach(person => {
    const card = document.createElement('div');
    card.className = `person-card ${person.received ? 'received' : ''}`;
    card.dataset.id = person.id;

    card.innerHTML = `
      <div class="card-header">
        <span class="card-num">No. ${String(person.id + 1).padStart(2, '0')}</span>
        <span class="card-badge ${person.received ? 'badge-success' : 'badge-danger'}">
          <i data-lucide="${person.received ? 'check' : 'x'}"></i>
          ${person.received ? '수령 완료' : '미수령'}
        </span>
      </div>
      <div class="card-name">${person.name}</div>
      <div class="check-control">
        <label class="custom-checkbox">
          <input type="checkbox" ${person.received ? 'checked' : ''} ${!state.isAdminMode ? 'disabled' : ''} data-id="${person.id}">
          <span class="checkmark"></span>
          <span>수령 여부</span>
        </label>
      </div>
    `;

    // 관리자 모드일 때만 체크박스 클릭 핸들러 추가
    if (state.isAdminMode) {
      const checkbox = card.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', (e) => {
        const id = parseInt(e.target.dataset.id);
        const isChecked = e.target.checked;
        
        // 상태 업데이트
        state.people[id].received = isChecked;
        
        // 해당 카드 스타일 변경
        if (isChecked) {
          card.classList.add('received');
          const badge = card.querySelector('.card-badge');
          badge.className = 'card-badge badge-success';
          badge.innerHTML = '<i data-lucide="check"></i> 수령 완료';
        } else {
          card.classList.remove('received');
          const badge = card.querySelector('.card-badge');
          badge.className = 'card-badge badge-danger';
          badge.innerHTML = '<i data-lucide="x"></i> 미수령';
        }
        
        lucide.createIcons();
        updateDashboardStats();
      });
    }

    gridContainer.appendChild(card);
  });

  lucide.createIcons();
  updateDashboardStats();
}

// 4. 대시보드 통계 업데이트 함수
function updateDashboardStats() {
  const total = state.people.length;
  const received = state.people.filter(p => p.received).length;
  const pending = total - received;
  const percentage = total > 0 ? Math.round((received / total) * 100) : 0;

  // DOM 반영
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-received').textContent = received;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-percentage').textContent = `${percentage}%`;
  
  const fillElement = document.getElementById('progress-fill');
  fillElement.style.width = `${percentage}%`;
}

// 5. Toast 알림 팝업 함수
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle-2';
  if (type === 'danger') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  // 사라지는 애니메이션 처리
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, duration);
}

// 6. 상태 로드 및 분석 (URL -> LocalStorage -> Default)
function loadInitialState() {
  const urlParams = new URLSearchParams(window.location.search);
  const stateParam = urlParams.get('state');

  if (stateParam && stateParam.length === 10) {
    // 1) URL 파라미터가 최우선
    try {
      const receivedArray = decodeState(stateParam);
      state.people.forEach((p, idx) => {
        p.received = receivedArray[idx] || false;
      });
      showToast('공유 링크를 통해 수령 현황을 불러왔습니다!', 'success');
      
      // URL에서 지저분한 쿼리를 남겨둘지 말지 고민이나, 
      // 새로고침해도 유지되게 그대로 두는 것이 맞습니다.
      return;
    } catch (e) {
      console.error('URL 상태 디코딩 실패', e);
      showToast('공유 링크 분석에 실패했습니다. 기본 값으로 복원합니다.', 'danger');
    }
  }

  // 2) 로컬 스토리지 확인
  const localSaved = localStorage.getItem('gas_subsidy_state');
  if (localSaved && localSaved.length === 10) {
    try {
      const receivedArray = decodeState(localSaved);
      state.people.forEach((p, idx) => {
        p.received = receivedArray[idx] || false;
      });
      showToast('이 기기에 마지막으로 저장된 데이터를 불러왔습니다.', 'info');
      return;
    } catch (e) {
      console.error('로컬스토리지 디코딩 실패', e);
    }
  }

  // 3) 모두 없으면 기본 미수령(false) 상태로 로드
  showToast('현황판이 준비되었습니다. 편집하려면 관리자 모드를 켜주세요.', 'info', 4000);
}

// 7. 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
  // 초기 상태 불러오기
  loadInitialState();
  
  // UI 최초 렌더링
  renderApp();

  // 관리자 모드 스위치
  const adminSwitch = document.getElementById('admin-switch');
  adminSwitch.addEventListener('change', (e) => {
    state.isAdminMode = e.target.checked;
    renderApp();
    if (state.isAdminMode) {
      showToast('관리자 편집 모드가 활성화되었습니다. 체크박스를 수정할 수 있습니다.', 'success');
    } else {
      showToast('관리자 편집 모드가 비활성화되었습니다. 읽기 전용 상태입니다.', 'info');
    }
  });

  // 검색 기능 (실시간 필터링)
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    renderApp();
  });

  // 필터 탭 클릭
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      filterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      
      state.currentFilter = e.target.dataset.filter;
      renderApp();
    });
  });

  // [공유 링크 생성] 버튼
  const btnShare = document.getElementById('btn-share');
  btnShare.addEventListener('click', () => {
    const hexCode = encodeState(state.people);
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const shareUrl = `${origin}${pathname}?state=${hexCode}`;

    // 클립보드 복사
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showToast('공유 가능한 상태 주소가 클립보드에 복사되었습니다! 사람들에게 전달하세요.', 'success', 5000);
      })
      .catch(err => {
        console.error('클립보드 복사 실패', err);
        // 대체 수단: 프롬프트 창으로 직접 주소 제공
        window.prompt('아래 주소를 복사하여 공유해 주세요:', shareUrl);
      });
  });

  // [로컬에 저장] 버튼
  const btnSave = document.getElementById('btn-save');
  btnSave.addEventListener('click', () => {
    const hexCode = encodeState(state.people);
    localStorage.setItem('gas_subsidy_state', hexCode);
    showToast('현재 체크 상태가 이 기기(브라우저)에 성공적으로 저장되었습니다!', 'success');
  });
});
