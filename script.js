// 全局变量
let currentUser = null;
let currentUserId = null;
let currentUserAvatar = null;

// 弹幕轨道状态 (用于防重叠)
let barrageRowStatus = Array.from({ length: 8 }, () => ({
    lastTime: 0,
    currentIndex: 0
}));

// 弹幕全局配置
// 差异化轨道速度 (30-50px/s 之间，比之前 60px/s 更慢)
const BARRAGE_ROW_SPEEDS = [30, 45, 35, 50, 32, 40, 38, 42]; 
const MIN_BARRAGE_GAP = 30; // 弹幕之间的最小间距 (像素)

// ===== 初始化所有功能 =====
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. 初始化 Swiper 轮播图
    const heroSwiper = new Swiper('.heroSwiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        }
    });
    
    // 2. 初始化 AOS 滚动动画
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });
    
    // 3. 导航栏滚动效果
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // 4. 移动端菜单切换
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // 5. 导航栏平滑滚动
    document.querySelectorAll('.nav-menu a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // 移动端关闭菜单
                navMenu.classList.remove('active');
            }
        });
    });
    
    // 6. 吕梁文化模块交互逻辑
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const contentItems = document.querySelectorAll('.content-item');
    const sidebarTrack = document.getElementById('sidebarTrack');
    
    // 点击侧边栏项
    sidebarItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            // 移除所有激活状态
            sidebarItems.forEach(i => i.classList.remove('active'));
            contentItems.forEach(c => c.classList.remove('active'));
            
            // 添加当前激活状态
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // 计算并应用旋转效果
            const itemHeight = 150; // 每个项目的高度（包括间距）
            const centerIndex = 1; // 中间位置的索引
            const offset = (index - centerIndex) * itemHeight;
            
            // 应用旋转和位移
            sidebarTrack.style.transform = `translateY(-${offset}px)`;
        });
    });
    
    // 7. 首屏滚动提示点击
    const scrollHint = document.querySelector('.hero-scroll');
    if (scrollHint) {
        scrollHint.addEventListener('click', function() {
            const spiritSection = document.querySelector('#spirit');
            if (spiritSection) {
                spiritSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // 7. 图片画廊拖拽滑动功能
    initImageGalleries();
    
    // 8. 登录/注册功能
    initAuth();
    
    // 9. 寄语墙功能（localStorage 版本）
    // 页面加载时只初始化一次弹幕
    loadMessages();
    
    // 移除之前的滚动监听 loadMessages，防止多次触发弹幕重叠
    window.addEventListener('scroll', function() {
        // 如果以后需要按需加载，可以在这里加锁，但目前初始化已足够
    });
    

    
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = document.getElementById('message').value.trim();
            
            if (!message) {
                alert('请填写寄语');
                return;
            }
            
            // 如果未登录，依然显示弹幕预览，但提醒登录
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) {
                // 创建一个临时的弹幕评论对象
                const previewComment = {
                    id: Date.now(),
                    username: '访客',
                    content: message,
                    likes: 0
                };
                // 直接显示在随机行
                addNewCommentToBarrage(previewComment);
                alert('留言已显示（预览），请登录后保存到服务器。');
                messageForm.reset();
                return;
            }
            
            saveMessage(message);
            messageForm.reset();
        });
    }
    
    // 10. 吕梁文旅模块 - 交互式地图
    initLvliangMap();
});

// ===== 登录/注册功能 =====
function initAuth() {
    // 检查本地存储中的登录状态
    currentUser = localStorage.getItem('currentUser');
    currentUserId = localStorage.getItem('currentUserId');
    currentUserAvatar = localStorage.getItem('currentUserAvatar');
    updateAuthUI();
    
    // 登录按钮点击事件
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            document.getElementById('loginModal').style.display = 'block';
        });
    }
    
    // 注册按钮点击事件
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            document.getElementById('registerModal').style.display = 'block';
        });
    }
    
    // 退出按钮点击事件
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentUserId');
            localStorage.removeItem('currentUserAvatar');
            currentUser = null;
            currentUserId = null;
            currentUserAvatar = null;
            updateAuthUI();
        });
    }
    
    // 关闭模态框
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('registerModal').style.display = 'none';
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        if (event.target == loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target == registerModal) {
            registerModal.style.display = 'none';
        }
    });
    
    // 登录表单提交
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            
            if (username && password) {
                // 发送登录请求到后端
                fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // 保存用户信息
                        localStorage.setItem('currentUser', data.data.username);
                        localStorage.setItem('currentUserId', data.data.id);
                        localStorage.setItem('currentUserAvatar', data.data.avatar);
                        currentUser = data.data.username;
                        currentUserId = data.data.id;
                        currentUserAvatar = data.data.avatar;
                        
                        updateAuthUI();
                        loadMessages();
                        document.getElementById('loginModal').style.display = 'none';
                        loginForm.reset();
                    } else {
                        alert(data.message || '登录失败');
                    }
                })
                .catch(error => {
                    console.error('登录失败:', error);
                    alert('登录失败，请稍后重试');
                });
            } else {
                alert('请填写用户名和密码');
            }
        });
    }
    
    // 注册表单提交
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();
            
            if (username && password && confirmPassword) {
                if (password === confirmPassword) {
                    // 发送注册请求到后端
                    fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            // 保存用户信息
                            localStorage.setItem('currentUser', data.data.username);
                            localStorage.setItem('currentUserId', data.data.id);
                            localStorage.setItem('currentUserAvatar', data.data.avatar);
                            currentUser = data.data.username;
                            currentUserId = data.data.id;
                            currentUserAvatar = data.data.avatar;
                            
                            updateAuthUI();
                            loadMessages();
                            document.getElementById('registerModal').style.display = 'none';
                            registerForm.reset();
                        } else {
                            alert(data.message || '注册失败');
                        }
                    })
                    .catch(error => {
                        console.error('注册失败:', error);
                        alert('注册失败，请稍后重试');
                    });
                } else {
                    alert('两次输入的密码不一致');
                }
            } else {
                alert('请填写所有字段');
            }
        });
    }
    
    // 绑定搜索按钮事件
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchUser);
    }
    
    // 绑定搜索输入框的回车事件
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchUser();
            }
        });
    }
}

// 检查用户名是否可用
function checkUsernameAvailability() {
    const usernameInput = document.getElementById('registerUsername');
    const feedbackDiv = document.getElementById('usernameFeedback');
    const username = usernameInput.value.trim();
    
    if (!username) {
        feedbackDiv.textContent = '';
        return;
    }
    
    // 向后端发送请求，检查用户名是否已被注册
    fetch(`/api/users/search?username=${encodeURIComponent(username)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // 用户名已存在
                feedbackDiv.textContent = '用户名已被注册';
                feedbackDiv.style.color = 'red';
            } else {
                // 用户名可用
                feedbackDiv.textContent = '用户名可用';
                feedbackDiv.style.color = 'green';
            }
        })
        .catch(error => {
            console.error('检查用户名失败:', error);
            feedbackDiv.textContent = '检查用户名失败，请稍后重试';
            feedbackDiv.style.color = 'orange';
        });
}

// 更新登录状态UI
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userInfo = document.getElementById('userInfo');
    const welcomeMsg = document.getElementById('welcomeMsg');
    const messageForm = document.getElementById('messageForm');
    const messageList = document.getElementById('messageList');
    
    if (currentUser) {
        // 登录状态
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.style.alignItems = 'center';
            userInfo.style.gap = '10px';
        }
        if (welcomeMsg) {
            welcomeMsg.textContent = `${currentUser}`;
            welcomeMsg.style.cursor = 'pointer';
            welcomeMsg.title = '点击进入我的主页';
            // 添加点击事件，进入我的主页
            welcomeMsg.onclick = function(event) {
                event.stopPropagation();
                event.preventDefault();
                showProfileView();
                return false;
            };
            // 移除可能存在的其他事件绑定
            welcomeMsg.onmouseover = null;
            welcomeMsg.onmouseout = null;
        }
        if (messageForm) messageForm.style.display = 'block';
        // 登录后自动加载所有历史评论
        loadMessages();
    } else {
        // 未登录状态
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (messageForm) messageForm.style.display = 'none';
        if (messageList) {
            // 显示登录提示，只有当留言列表为空时
            const messages = JSON.parse(localStorage.getItem('lvliang_messages')) || [];
            if (messages.length === 0) {
                messageList.innerHTML = '<div class="message-item" style="text-align:center; color:#888;">请登录后发表留言</div>';
            }
        }
    }
}

// ===== 吕梁文旅模块 - 静态图片地图 =====
let venuesData = [];
let currentDistrict = null;

// 区县边界数据（用于根据坐标判断所属区县）
const districtBoundaries = {
    '离石区': { minLng: 111.0, maxLng: 111.3, minLat: 37.4, maxLat: 37.6 },
    '孝义市': { minLng: 111.6, maxLng: 111.9, minLat: 37.1, maxLat: 37.3 },
    '汾阳市': { minLng: 111.7, maxLng: 112.0, minLat: 37.2, maxLat: 37.4 },
    '文水县': { minLng: 112.0, maxLng: 112.3, minLat: 37.4, maxLat: 37.6 },
    '交城县': { minLng: 112.1, maxLng: 112.4, minLat: 37.5, maxLat: 37.7 },
    '兴县': { minLng: 110.8, maxLng: 111.2, minLat: 38.2, maxLat: 38.5 },
    '临县': { minLng: 110.7, maxLng: 111.1, minLat: 37.9, maxLat: 38.2 },
    '柳林县': { minLng: 110.8, maxLng: 111.2, minLat: 37.3, maxLat: 37.6 },
    '石楼县': { minLng: 110.7, maxLng: 111.0, minLat: 36.9, maxLat: 37.2 },
    '岚县': { minLng: 111.5, maxLng: 111.9, minLat: 38.2, maxLat: 38.5 },
    '方山县': { minLng: 111.1, maxLng: 111.5, minLat: 37.8, maxLat: 38.1 },
    '中阳县': { minLng: 111.1, maxLng: 111.4, minLat: 37.3, maxLat: 37.6 },
    '交口县': { minLng: 111.3, maxLng: 111.6, minLat: 36.9, maxLat: 37.2 }
};

// 初始化吕梁地图
function initLvliangMap() {
    // 检查是否在吕梁文旅页面
    const mapContainer = document.getElementById('lvliangMap');
    if (!mapContainer) return;
    
    // 加载场馆数据
    loadVenuesData();
    
    // 绑定热区点击事件
    bindAreaClickEvents();
}

// 绑定热区点击事件
function bindAreaClickEvents() {
    const areas = document.querySelectorAll('#lvliangMapAreas area');
    areas.forEach(area => {
        area.addEventListener('click', function(e) {
            e.preventDefault();
            const district = this.getAttribute('data-district');
            highlightDistrict(district);
            showVenuesByDistrict(district);
        });
    });
    
    // 绑定区县标签点击事件
    bindDistrictLabelEvents();
}

// 绑定区县标签点击事件
function bindDistrictLabelEvents() {
    const labels = document.querySelectorAll('.district-label');
    labels.forEach(label => {
        label.addEventListener('click', function() {
            const district = this.getAttribute('data-district');
            highlightDistrict(district);
            showVenuesByDistrict(district);
        });
    });
}

// 高亮选中的区县
function highlightDistrict(districtName) {
    currentDistrict = districtName;
    
    // 移除所有热区高亮
    document.querySelectorAll('#lvliangMapAreas area').forEach(area => {
        area.classList.remove('active');
    });
    
    // 移除所有标签高亮
    document.querySelectorAll('.district-label').forEach(label => {
        label.classList.remove('active');
    });
    
    // 添加当前热区高亮
    const activeArea = document.querySelector(`#lvliangMapAreas area[data-district="${districtName}"]`);
    if (activeArea) {
        activeArea.classList.add('active');
    }
    
    // 添加当前标签高亮
    const activeLabel = document.querySelector(`.district-label[data-district="${districtName}"]`);
    if (activeLabel) {
        activeLabel.classList.add('active');
    }
    
    // 更新标题
    const titleElement = document.querySelector('.venue-list-title');
    if (titleElement) {
        titleElement.textContent = `${districtName} - 文化场馆列表`;
    }
}

// 加载场馆数据
function loadVenuesData() {
    // 从本地文件读取数据
    fetch('lvliangtravel/lvliangtravel.txt')
        .then(response => response.text())
        .then(text => {
            // 解析Markdown格式数据
            const lines = text.split('\n');
            let currentDistrict = null;
            let currentVenue = null;
            let currentField = null;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // 跳过空行
                if (line === '') continue;
                
                // 检测区县标题（## 区县名）
                if (line.startsWith('## ') && !line.startsWith('### ')) {
                    currentDistrict = line.replace('## ', '').trim();
                    continue;
                }
                
                // 检测场馆标题（### 1. 场馆名）
                if (line.startsWith('### ')) {
                    // 如果有当前场馆，保存它
                    if (currentVenue && currentDistrict) {
                        // 检查区县是否属于吕梁市下辖区县
                        const validDistricts = ['离石区', '岚县', '方山县', '中阳县', '交口县', '柳林县', '石楼县', '兴县', '临县', '孝义市', '汾阳市', '交城县', '文水县'];
                        if (validDistricts.includes(currentDistrict)) {
                            // 检查是否已存在同名同区的场馆
                            const existingVenue = venuesData.find(venue => 
                                venue.name === currentVenue.name && 
                                venue.district === currentVenue.district
                            );
                            if (!existingVenue) {
                                venuesData.push(currentVenue);
                            }
                        }
                    }
                    
                    // 创建新场馆
                    const nameMatch = line.match(/### \d+\.\s*(.+)/);
                    if (nameMatch) {
                        currentVenue = {
                            name: nameMatch[1].trim(),
                            district: currentDistrict,
                            coordinates: '',
                            address: '',
                            collection: '',
                            function: '',
                            background: ''
                        };
                        currentField = null;
                    }
                    continue;
                }
                
                // 检测场馆详情
                if (currentVenue) {
                    if (line.startsWith('坐标：')) {
                        // 解析坐标
                        const coordText = line.replace('坐标：', '').trim();
                        // 转换格式：东经111.1305°，北纬37.5168° -> 111.1305,37.5168
                        const lngMatch = coordText.match(/东经(\d+\.?\d*)/);
                        const latMatch = coordText.match(/北纬(\d+\.?\d*)/);
                        if (lngMatch && latMatch) {
                            currentVenue.coordinates = `${lngMatch[1]},${latMatch[1]}`;
                        }
                        currentField = 'coordinates';
                    } else if (line.startsWith('地址：')) {
                        currentVenue.address = line.replace('地址：', '').trim();
                        currentField = 'address';
                    } else if (line.startsWith('馆藏 / 核心景观：') || line.startsWith('馆藏/核心景观：')) {
                        currentVenue.collection = line.replace(/馆藏\s*\/\s*核心景观：/, '').trim();
                        currentField = 'collection';
                    } else if (line.startsWith('里面有什么：')) {
                        currentVenue.collection = line.replace('里面有什么：', '').trim();
                        currentField = 'collection';
                    } else if (line.startsWith('功能定位：')) {
                        currentVenue.function = line.replace('功能定位：', '').trim();
                        currentField = 'function';
                    } else if (line.startsWith('功能定位')) {
                        // 处理多行的功能定位
                        currentVenue.function = line.replace('功能定位', '').trim();
                        currentField = 'function';
                    } else if (line.startsWith('干什么的：')) {
                        currentVenue.function = line.replace('干什么的：', '').trim();
                        currentField = 'function';
                    } else if (line.startsWith('历史文化：')) {
                        currentVenue.background = line.replace('历史文化：', '').trim();
                        currentField = 'background';
                    } else if (line.startsWith('历史文化')) {
                        // 处理多行的历史文化
                        currentVenue.background = line.replace('历史文化', '').trim();
                        currentField = 'background';
                    } else if (currentField) {
                        // 继续追加内容
                        if (currentVenue[currentField]) {
                            currentVenue[currentField] += ' ' + line;
                        }
                    }
                }
            }
            
            // 保存最后一个场馆
            if (currentVenue && currentDistrict) {
                // 检查区县是否属于吕梁市下辖区县
                const validDistricts = ['离石区', '岚县', '方山县', '中阳县', '交口县', '柳林县', '石楼县', '兴县', '临县', '孝义市', '汾阳市', '交城县', '文水县'];
                if (validDistricts.includes(currentDistrict)) {
                    // 检查是否已存在同名同区的场馆
                    const existingVenue = venuesData.find(venue => 
                        venue.name === currentVenue.name && 
                        venue.district === currentVenue.district
                    );
                    if (!existingVenue) {
                        venuesData.push(currentVenue);
                    }
                }
            }
            

        })
        .catch(error => {
        });
}





// 根据区县显示场馆列表
function showVenuesByDistrict(district) {
    const venueList = document.getElementById('venueList');
    const venueDetail = document.getElementById('venueDetail');
    
    // 清空列表和详情
    venueList.innerHTML = '';
    venueDetail.innerHTML = '';
    
    // 筛选该区县的场馆（直接使用district字段）
    const filteredVenues = venuesData.filter(venue => {
        return venue.district === district;
    });
    
    if (filteredVenues.length === 0) {
        venueList.innerHTML = '<p class="venue-list-placeholder">该区域暂无场馆数据</p>';
        return;
    }
    
    // 生成场馆列表
    filteredVenues.forEach(venue => {
        const venueItem = document.createElement('div');
        venueItem.className = 'venue-item';
        venueItem.innerHTML = `
            <h4>${venue.name}</h4>
        `;
        
        // 添加点击事件
        venueItem.addEventListener('click', function() {
            showVenueDetail(venue);
        });
        
        venueList.appendChild(venueItem);
    });
}

// 区县名称到文件夹名称的映射
const districtToFolder = {
    '离石区': 'lishi',
    '汾阳市': 'fenyang',
    '孝义市': 'xiaoyi',
    '文水县': 'wenshui',
    '交城县': 'jiaocheng',
    '兴县': 'xinxian',
    '临县': 'linxian',
    '柳林县': 'liulin',
    '石楼县': 'shilou',
    '岚县': 'lanxian',
    '方山县': 'fangshan',
    '中阳县': 'zhongyang',
    '交口县': 'jiaoko'
};

// 场馆名称到文件名的映射
const venueToFilename = {
    '吕梁市博物馆（原吕梁市汉画像石博物馆）': '吕梁市博物馆.mp4',
    '白马仙洞': '白马仙洞.mp4',
    '安国寺（吕梁市离石区）': '安国寺.mp4',
    '汾酒博物馆': '汾酒博物馆.mp4',
    '汾阳王府': '汾阳王府.mp4',
    '孝义市皮影木偶艺术博物馆': '孝义市皮影木偶艺术博物馆.mp4',
    '胜溪湖森林公园': '胜西湖森林公园.mp4',
    '刘胡兰纪念馆（吕梁精神核心红色地标）': '刘胡兰纪念馆.mp4',
    '文水博物馆': '文水博物馆.mp4',
    '卦山风景区': '卦山风景区.mp4',
    '庞泉沟国家级自然保护区': '庞泉沟国家级自然保护区.mp4',
    '晋绥边区革命纪念馆（蔡家崖，吕梁精神发源地）': '晋绥边区革命纪念馆.mp4',
    '黄河奇石湾（六郎寨）': '黄河奇石湾.mp4',
    '碛口古镇': '碛口古镇.mp4',
    '义居寺': '义居寺.mp4',
    '玉虚宫': '玉虚宫.mp4',
    '香严寺': '香严寺.mp4',
    '永由古槐': '永由古槐.mp4',
    '红军东征纪念馆（吕梁精神地标）': '红军东征纪念馆.mp4',
    '白龙山景区': '白龙山景区.mp4',
    '岚县烈士陵园': '岚县烈士陵园.jpg',
    '北武当山': '北武当山.mp4',
    '大武木楼': '大武木楼.mp4',
    '中阳县烈士楼': '中阳县烈士楼.mp4',
    '柏洼山风景区': '柏洼山风景区.mp4',
    '云梦山': '云梦山.mp4',
    '红军东征总指挥部旧址': '红军东征总指挥部旧址.mp4'
};

// 显示场馆详情
function showVenueDetail(venue) {
    const venueDetail = document.getElementById('venueDetail');
    
    // 解析坐标
    const coordStr = venue.coordinates;
    let longitude, latitude;
    if (coordStr.includes('°')) {
        // 处理度分秒格式
        const coordParts = coordStr.split('/');
        longitude = parseFloat(coordParts[0].replace('°', ''));
        latitude = parseFloat(coordParts[1].replace('°', ''));
    } else {
        // 处理小数格式
        const coordParts = coordStr.split(',');
        longitude = parseFloat(coordParts[0]);
        latitude = parseFloat(coordParts[1]);
    }
    
    // 构建本地媒体文件路径
    let mediaHtml = '';
    const districtFolder = districtToFolder[venue.district];
    const filename = venueToFilename[venue.name];
    
    if (districtFolder && filename) {
        const mediaPath = `lvliangtravel/${districtFolder}/${filename}`;
        if (filename.endsWith('.mp4')) {
            mediaHtml = `
                <div class="venue-image">
                    <video src="${mediaPath}" 
                           alt="${venue.name}" 
                           style="width: 70%; border-radius: 10px; margin-bottom: 15px; margin-left: auto; margin-right: auto; display: block;"
                           controls onended="this.pause();">
                    </video>
                </div>
            `;
        } else if (filename.endsWith('.jpg')) {
            mediaHtml = `
                <div class="venue-image">
                    <img src="${mediaPath}" 
                         alt="${venue.name}" 
                         style="width: 70%; border-radius: 10px; margin-bottom: 15px; margin-left: auto; margin-right: auto; display: block;">
                </div>
            `;
        }
    }
    
    // 如果没有找到本地媒体文件，使用默认的在线图片
    if (!mediaHtml) {
        mediaHtml = `
            <div class="venue-image">
                <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(venue.name + ' 吕梁 旅游景点 博物馆')}&image_size=landscape_4_3" 
                     alt="${venue.name}" 
                     style="width: 70%; border-radius: 10px; margin-bottom: 15px; margin-left: auto; margin-right: auto; display: block;">
            </div>
        `;
    }
    
    venueDetail.innerHTML = `
        <h4>${venue.name}</h4>
        ${mediaHtml}
        <p><strong>地址：</strong>${venue.address || '暂无地址信息'}</p>
        <p><strong>馆藏/核心景观：</strong>${venue.collection}</p>
        <p><strong>功能定位：</strong>${venue.function}</p>
        <p><strong>历史文化背景：</strong>${venue.background}</p>
    `;
    
    // 在静态地图上标记场馆位置
    markVenueOnStaticMap(venue, longitude, latitude);
}

// 初始化图片画廊点击滚动功能
function initImageGalleries() {
    const galleries = document.querySelectorAll('.image-gallery');
    
    galleries.forEach(gallery => {
        // 点击滚动功能
        gallery.addEventListener('click', (e) => {
            const rect = gallery.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const galleryWidth = rect.width;
            
            // 点击左侧区域，向左滚动
            if (clickX < galleryWidth / 3) {
                gallery.scrollBy({ left: -300, behavior: 'smooth' });
            }
            // 点击右侧区域，向右滚动
            else if (clickX > galleryWidth * 2 / 3) {
                gallery.scrollBy({ left: 300, behavior: 'smooth' });
            }
        });
        
        // 滚动事件监听
        gallery.addEventListener('scroll', () => {
            updateScrollIndicator(gallery);
        });
        
        // 触摸设备支持
        gallery.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const startX = touch.clientX;
            
            gallery.addEventListener('touchend', function onTouchEnd(e) {
                const endX = e.changedTouches[0].clientX;
                const diffX = endX - startX;
                
                // 左右滑动
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        // 向右滑动，显示左边内容
                        gallery.scrollBy({ left: -300, behavior: 'smooth' });
                    } else {
                        // 向左滑动，显示右边内容
                        gallery.scrollBy({ left: 300, behavior: 'smooth' });
                    }
                }
                
                gallery.removeEventListener('touchend', onTouchEnd);
            });
        });
    });
}

// 更新滚动指示器
function updateScrollIndicator(gallery) {
    const indicator = gallery.nextElementSibling;
    if (!indicator || !indicator.classList.contains('scroll-indicator')) return;
    
    const items = gallery.querySelectorAll('.gallery-item');
    const scrollPosition = gallery.scrollLeft;
    const itemWidth = items[0].offsetWidth + 24; // 24px是gap
    const totalWidth = items.length * itemWidth;
    const visibleWidth = gallery.offsetWidth;
    
    // 计算当前位置对应的指示器索引
    const position = scrollPosition / (totalWidth - visibleWidth);
    const index = Math.min(Math.round(position * 2), 2); // 3个指示器，索引0-2
    
    // 更新指示器状态
    const spans = indicator.querySelectorAll('span');
    spans.forEach((span, i) => {
        if (i === index) {
            span.classList.add('active');
        } else {
            span.classList.remove('active');
        }
    });
}

// 在静态地图上标记场馆位置
function markVenueOnStaticMap(venue, longitude, latitude) {
    const markersContainer = document.getElementById('mapMarkers');
    if (!markersContainer) return;
    
    // 清空之前的标记
    markersContainer.innerHTML = '';
    
    // 计算标记位置（这里简化处理，实际需要根据地图比例调整）
    // 假设地图宽度为500px，经度范围为110.7-112.4
    // 纬度范围为36.9-38.5
    const mapWidth = 500;
    const mapHeight = 400;
    const lngRange = 112.4 - 110.7;
    const latRange = 38.5 - 36.9;
    
    const x = ((longitude - 110.7) / lngRange) * mapWidth;
    const y = mapHeight - ((latitude - 36.9) / latRange) * mapHeight;
    
    // 创建标记
    const marker = document.createElement('div');
    marker.className = 'map-marker';
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.title = venue.name;
    
    markersContainer.appendChild(marker);
}

// 全局函数 - 保存留言
function saveMessage(message) {
    // 从 localStorage 读取用户信息
    const currentUser = localStorage.getItem('currentUser');
    const currentUserId = localStorage.getItem('currentUserId');
    
    if (!currentUser || !currentUserId) {
        alert('请先登录');
        return;
    }
    
    // 发送评论到后端
    fetch('/api/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: currentUserId,
            username: currentUser,
            content: message
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('评论保存响应:', data);
        if (data.status === 'success') {
            // 立即添加新评论到弹幕显示
            const newComment = {
                id: data.data.id,
                user_id: currentUserId,
                username: currentUser,
                content: message,
                likes: 0,
                created_at: new Date().toISOString()
            };
            
            // 立即在弹幕中显示
            console.log('正在向弹幕添加新评论:', newComment);
            addNewCommentToBarrage(newComment);
            
            // 刷新个人中心评论列表
            console.log('正在刷新个人中心评论列表...');
            if (typeof loadMyComments === 'function') {
                loadMyComments();
            }
        } else {
            console.error('评论保存失败:', data.message);
            alert(data.message || '评论失败');
        }
    })
    .catch(error => {
        console.error('评论请求错误:', error);
        alert('评论失败，请稍后重试');
    });
}

// 立即添加新评论到弹幕
function addNewCommentToBarrage(comment) {
    const rows = [
        document.getElementById('barrageRow1'),
        document.getElementById('barrageRow2'),
        document.getElementById('barrageRow3'),
        document.getElementById('barrageRow4'),
        document.getElementById('barrageRow5'),
        document.getElementById('barrageRow6'),
        document.getElementById('barrageRow7'),
        document.getElementById('barrageRow8')
    ];
    
    // 过滤无效轨道
    const validRows = rows.filter(row => row !== null);
    if (validRows.length === 0) return;
    
    // 随机选择一条轨道
    const rowIndex = Math.floor(Math.random() * validRows.length);
    const row = validRows[rowIndex];
    
    // 检查用户是否已点赞
    let isLiked = false;
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const userLikes = JSON.parse(localStorage.getItem('lvliang_user_likes')) || {};
        if (userLikes[currentUser] && userLikes[currentUser].includes(comment.id)) {
            isLiked = true;
        }
    }
    
    // 创建弹幕元素
    const barrageItem = document.createElement('div');
    barrageItem.className = 'barrage-item';
    barrageItem.style.position = 'absolute';
    barrageItem.style.visibility = 'hidden'; // 先隐藏以便测量宽度
    
    barrageItem.innerHTML = `
        <span>${escapeHtml(comment.content)}</span>
        <button class="like-btn" onclick="toggleLike(${comment.id})" style="background: none; border: none; cursor: pointer;">
            ${isLiked ? '❤️' : '🤍'}
        </button>
    `;
    
    // 添加到轨道进行测量
    row.appendChild(barrageItem);
    const itemWidth = barrageItem.offsetWidth || 200;
    const containerWidth = row.offsetWidth || 1080;
    
    // 计算发射延迟
    const currentTime = Date.now();
    const lastItemTime = barrageRowStatus[rowIndex].lastTime;
    
    // 确保与上一条弹幕有足够间距
    // 延迟 = max(0, 上次发射时间 + (上次宽度 + 间距)/速度 - 当前时间)
    const requiredDelay = Math.max(0, lastItemTime + (itemWidth + MIN_BARRAGE_GAP) * 1000 / BARRAGE_ROW_SPEEDS[rowIndex] - currentTime);
    
    // 更新轨道状态
    barrageRowStatus[rowIndex].lastTime = currentTime + requiredDelay;
    
    setTimeout(() => {
        barrageItem.style.visibility = 'visible';
        barrageItem.style.right = `-${itemWidth}px`;
        
        // 触发重排
        barrageItem.offsetWidth;
        
        // 动画时间 = (容器宽度 + 弹幕宽度) / 速度
        const animationTime = (containerWidth + itemWidth) / BARRAGE_ROW_SPEEDS[rowIndex];
        const endPos = containerWidth + 100;
        
        barrageItem.style.transition = `right ${animationTime}s linear`;
        barrageItem.style.right = `${endPos}px`;
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (row.contains(barrageItem)) {
                row.removeChild(barrageItem);
            }
        }, animationTime * 1000);
    }, requiredDelay);
}

// 全局函数 - 转义HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// 全局变量 - 弹幕初始化状态
let isBarrageStarted = false;

// 全局函数 - 弹幕效果
function startMessageBarrage(messages) {
    if (isBarrageStarted) return; // 防止重复初始化
    isBarrageStarted = true;
    
    try {
        // 获取8条弹幕轨道
        const rows = [
            document.getElementById('barrageRow1'),
            document.getElementById('barrageRow2'),
            document.getElementById('barrageRow3'),
            document.getElementById('barrageRow4'),
            document.getElementById('barrageRow5'),
            document.getElementById('barrageRow6'),
            document.getElementById('barrageRow7'),
            document.getElementById('barrageRow8')
        ];
        
        // 过滤无效轨道
        const validRows = rows.filter(row => row !== null);
        if (validRows.length === 0) return;
        
        // 清空所有轨道
        validRows.forEach(row => row.innerHTML = '');
        
        // 确保 messages 是数组
        if (!Array.isArray(messages)) {
            messages = [];
        }
        
        // 确保至少有8条评论
        while (messages.length < 8) {
            // 从预设评论中添加
            const presetComments = [
                "吕梁精神，永垂不朽",
                "传承红色，不忘初心",
                "英雄吕梁，精神长存",
                "艰苦奋斗，代代相传",
                "吕梁风骨，照亮前行",
                "忠诚担当，吕梁本色",
                "红色吕梁，精神铸魂",
                "实干奉献，吕梁力量",
                "一脉相承，吕梁精神",
                "赓续血脉，砥砺前行"
            ];
            
            // 随机选择一个预设评论
            const randomComment = presetComments[Math.floor(Math.random() * presetComments.length)];
            // 添加到消息列表
            messages.push({ id: Date.now() + messages.length, content: randomComment, likes: 0 });
        }
        
        // 计算屏幕宽度
        const screenWidth = 1080;
        // 默认速度：50像素/秒，让用户能更清楚地看到弹幕
        const defaultSpeed = 50;
        // 最小间隔：0.8秒
        const minInterval = 0.8;
        
        // 为每条轨道添加弹幕，带索引
        function addBarrageToRowWithIndex(rowIndex, messageIndex) {
            const row = validRows[rowIndex];
            if (!row) return;
            
            // 限制每个轨道中的弹幕数量，最多5条
            if (row.children.length >= 5) {
                setTimeout(() => {
                    addBarrageToRowWithIndex(rowIndex, messageIndex);
                }, 1000);
                return;
            }
            
            // 获取评论（循环显示）
            const msg = messages[messageIndex % messages.length];
            
            // 检查用户是否已点赞
            let isLiked = false;
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    const userLikes = JSON.parse(localStorage.getItem('lvliang_user_likes')) || {};
                    if (userLikes[currentUser] && userLikes[currentUser].includes(msg.id)) {
                        isLiked = true;
                    }
                }
            } catch (e) {}
            
            // 创建弹幕元素
            const barrageItem = document.createElement('div');
            barrageItem.className = 'barrage-item';
            barrageItem.style.position = 'absolute';
            barrageItem.style.visibility = 'hidden'; // 先隐藏以便测量宽度
            
            barrageItem.innerHTML = `
                <span>${escapeHtml(msg.content)}</span>
                <button class="like-btn" onclick="toggleLike(${msg.id})" style="background: none; border: none; cursor: pointer;">
                    ${isLiked ? '❤️' : '🤍'}
                </button>
            `;
            
            // 添加到轨道
            row.appendChild(barrageItem);
            
            // 测量宽度
            const itemWidth = barrageItem.offsetWidth || 200;
            const containerWidth = row.offsetWidth || 1080;
            
            // 计算发射延迟
            const currentTime = Date.now();
            const lastItemTime = barrageRowStatus[rowIndex].lastTime;
            
            // 确保与上一条弹幕有足够间距
            // 基础延迟：(宽度 + 间距) / 速度
            // 额外随机延迟增加灵动感
            const baseDelay = (itemWidth + MIN_BARRAGE_GAP) * 1000 / BARRAGE_ROW_SPEEDS[rowIndex];
            const randomExtra = Math.random() * 2000; // 0-2秒随机延迟
            const requiredDelay = Math.max(0, lastItemTime + baseDelay + randomExtra - currentTime);
            
            // 更新轨道状态
            barrageRowStatus[rowIndex].lastTime = currentTime + requiredDelay;
            barrageRowStatus[rowIndex].currentIndex = (messageIndex + 1) % messages.length;
            
            // 应用动画效果
            setTimeout(() => {
                barrageItem.style.visibility = 'visible';
                barrageItem.style.right = `-${itemWidth}px`;
                
                // 触发重排
                barrageItem.offsetWidth;
                
                // 动画时间 = (容器宽度 + 弹幕宽度) / 速度
                const animationTime = (containerWidth + itemWidth) / BARRAGE_ROW_SPEEDS[rowIndex];
                const endPos = containerWidth + 100;
                
                barrageItem.style.transition = `right ${animationTime}s linear`;
                barrageItem.style.right = `${endPos}px`;
                
                // 动画结束后移除元素并添加下一条
                setTimeout(() => {
                    if (row.contains(barrageItem)) {
                        row.removeChild(barrageItem);
                    }
                    
                    // 继续添加下一条弹幕
                    const nextMessageIndex = (messageIndex + 1) % messages.length;
                    addBarrageToRowWithIndex(rowIndex, nextMessageIndex);
                }, animationTime * 1000);
            }, requiredDelay);
        }
        
        // 为每条轨道启动弹幕
        validRows.forEach((_, index) => {
            // 立即启动，不需要延迟
            const messageIndex = index % messages.length;
            addBarrageToRowWithIndex(index, messageIndex);
        });
    } catch (e) {
        // 忽略错误
    }
}

// 全局函数 - 重新加载留言
function loadMessages() {
    const messageBarrage = document.getElementById('messageBarrage');
    if (!messageBarrage) return;

    // 从后端获取评论，设置较大的 limit 参数以获取所有评论
    fetch('/api/comments?limit=100')
    .then(response => response.json())
    .then(data => {
        let messages = [];
        
        // 处理不同的数据格式
        if (data.status === 'success' && data.data) {
            messages = data.data;
        } else if (Array.isArray(data)) {
            messages = data;
        }
        
        // 确保 messages 是数组
        if (!Array.isArray(messages)) {
            messages = [];
        }
        
        // 转换数据格式，确保每条评论有 id, content, likes 字段
        const formattedMessages = messages.map((msg, index) => ({
            id: msg.id || msg.comment_id || Date.now() + index,
            content: msg.content || msg.comment || '',
            likes: msg.likes || 0
        }));
        
        // 检查是否需要使用预设弹幕
        let finalMessages = formattedMessages;
        if (finalMessages.length === 0) {
            // 使用预设弹幕
            const presetMessages = [
                { id: 1, content: '吕梁精神，永垂不朽', likes: 0 },
                { id: 2, content: '对党忠诚，无私奉献', likes: 0 },
                { id: 3, content: '铭记历史，吾辈自强', likes: 0 }
            ];
            finalMessages = presetMessages;
        }
        
        // 启动弹幕效果
        startMessageBarrage(finalMessages);
    })
    .catch(() => {
        // 即使失败也要显示预设弹幕
        const presetMessages = [
            { id: 1, content: '吕梁精神，永垂不朽', likes: 0 },
            { id: 2, content: '对党忠诚，无私奉献', likes: 0 },
            { id: 3, content: '铭记历史，吾辈自强', likes: 0 }
        ];
        startMessageBarrage(presetMessages);
    });
}

// 测试函数
function testFunction() {
    alert('测试函数被调用了');
    console.log('测试函数被调用了');
}

// 简单弹幕函数
function simpleBarrage(messages) {
    console.log('simpleBarrage 函数被调用了，弹幕数量:', messages.length);
    console.log('弹幕内容:', messages);
    
    // 获取弹幕容器
    const messageBarrage = document.getElementById('messageBarrage');
    if (!messageBarrage) {
        console.log('messageBarrage 元素不存在');
        return;
    }
    
    // 清空容器
    messageBarrage.innerHTML = '';
    
    // 创建弹幕元素
    messages.forEach((msg, index) => {
        const barrageItem = document.createElement('div');
        barrageItem.className = 'barrage-item';
        barrageItem.style.position = 'relative';
        barrageItem.style.margin = '5px';
        barrageItem.style.padding = '10px';
        barrageItem.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        barrageItem.style.color = 'white';
        barrageItem.style.borderRadius = '5px';
        barrageItem.innerHTML = `<span>${msg.content}</span>`;
        messageBarrage.appendChild(barrageItem);
        console.log('添加弹幕:', msg.content);
    });
}

// 全局函数 - 显示我的主页视图
function showProfileView() {
    // 隐藏主内容区域
    document.querySelectorAll('section, footer, nav').forEach(element => {
        element.style.display = 'none';
    });
    
    // 显示我的主页视图
    const profileView = document.getElementById('profileView');
    if (profileView) {
        // 预设红色精神色系（降低饱和度）
        const redSpiritColors = [
            '#8B4513', // 棕色红（降低饱和度）
            '#A0522D', // 红棕色（降低饱和度）
            '#CD853F', // 秘鲁色（降低饱和度）
            'linear-gradient(135deg, #8B4513, #654321)', // 棕色到深棕色的渐变
            'linear-gradient(45deg, #A0522D, #D2B48C)', // 红棕色到棕褐色的渐变
            'radial-gradient(circle, #8B4513, #3E2723)' // 径向渐变（降低饱和度）
        ];
        
        // 随机选择一种颜色
        const randomColor = redSpiritColors[Math.floor(Math.random() * redSpiritColors.length)];
        
        // 设置背景颜色
        profileView.style.background = randomColor;
        profileView.style.display = 'block';
    }
    
    // 显示用户信息
    const profileUserName = document.getElementById('profileUserName');
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileUserName) {
        profileUserName.textContent = currentUser || '未登录';
    }
    if (profileAvatar) {
        profileAvatar.src = currentUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser || 'guest'}`;
    }
    
    // 加载评论
    loadMyComments();
    loadLikedComments();
}

// 全局变量 - 搜索到的用户信息
let searchedUser = null;

// 全局函数 - 从弹幕中移除被删除的评论
function removeMessageFromBarrage(commentId) {
    // 这里可以实现从弹幕系统中移除评论的逻辑
    // 由于弹幕系统是动态生成的，我们可以在下次加载时自动排除被删除的评论
    // 或者如果有存储弹幕数据的数组，可以直接从数组中移除
    console.log('从弹幕中移除评论:', commentId);
    
    // 重新加载留言列表，确保弹幕中不再显示被删除的评论
    loadMessages();
}

// 全局函数 - 搜索用户
function searchUser() {
    const searchInput = document.getElementById('userSearch');
    const username = searchInput.value.trim();
    
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    // 模拟搜索用户，实际应该从后端 API 获取
    // 这里我们假设后端有一个搜索用户的 API
    fetch(`/api/users/search?username=${encodeURIComponent(username)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.data) {
                searchedUser = data.data;
                showOtherProfile(data.data);
            } else {
                alert('用户不存在');
            }
        })
        .catch(error => {
            // 如果后端 API 不存在，使用模拟数据
            simulateSearchUser(username);
        });
}

// 模拟搜索用户（当后端 API 不存在时使用）
function simulateSearchUser(username) {
    // 模拟用户数据
    const users = [
        { id: 1, username: 'user1', avatar: '' },
        { id: 2, username: 'user2', avatar: '' },

        { id: 3, username: 'user3', avatar: '' }
    ];
    
    const user = users.find(u => u.username === username);
    if (user) {
        searchedUser = user;
        showOtherProfile(user);
    } else {
        alert('用户不存在');
    }
}

// 全局变量 - 弹幕队列管理
let barrageQueue = [];

// 全局函数 - 弹幕队列管理
function addNewMessageToBarrage(newMessage) {
    // 立即在弹幕中显示
    addNewCommentToBarrage(newMessage);
    
    // 刷新页面其他相关部分
    if (typeof loadMyComments === 'function') {
        loadMyComments();
    }
}

// 页面加载完成后执行测试
// 移除测试弹幕函数，不再自动执行测试

// 全局函数 - 显示他人主页
function showOtherProfile(user) {
    // 隐藏主内容区域
    document.querySelectorAll('section, footer, nav').forEach(element => {
        element.style.display = 'none';
    });
    
    // 显示他人主页视图
    const otherProfileView = document.getElementById('otherProfileView');
    if (otherProfileView) {
        otherProfileView.style.display = 'block';
    }
    
    // 更新用户信息
    document.getElementById('otherProfileUserName').textContent = user.username;
    document.getElementById('otherProfileAvatar').src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`;
    
    // 加载他人的评论
    loadOtherUserComments(user.id);
    loadOtherUserLikedComments(user.id);
}

// 全局函数 - 加载他人发布的评论
function loadOtherUserComments(userId) {
    const commentsList = document.getElementById('otherCommentsList');
    
    fetch(`/api/users/${userId}/comments`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const comments = data.data || [];
                
                if (comments.length === 0) {
                    commentsList.innerHTML = '<div class="empty-message">该用户还没有发布过评论</div>';
                    return;
                }
                
                commentsList.innerHTML = comments.map(comment => `
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-weight: 600; color: #333;">${comment.username}</span>
                            <span style="font-size: 12px; color: #999;">${new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <div style="color: #333; line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap;">${comment.content}</div>
                        <div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: #666;">
                            <button class="like-btn" onclick="toggleLike(${comment.id})" style="background: none; border: none; cursor: pointer; color: #666; display: flex; align-items: center;">
                                <i class="fas fa-heart"></i> <span style="margin-left: 5px;">${comment.likes}</span>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                commentsList.innerHTML = '<div class="empty-message">加载评论失败</div>';
            }
        })
        .catch(error => {
            console.error('加载评论失败:', error);
            commentsList.innerHTML = '<div class="empty-message">加载评论失败，请稍后重试</div>';
        });
}

// 全局函数 - 加载他人点赞过的评论
function loadOtherUserLikedComments(userId) {
    const commentsList = document.getElementById('otherLikedCommentsList');
    
    fetch(`/api/users/${userId}/liked-comments`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const comments = data.data || [];
                
                if (comments.length === 0) {
                    commentsList.innerHTML = '<div class="empty-message">该用户还没有点赞过评论</div>';
                    return;
                }
                
                commentsList.innerHTML = comments.map(comment => `
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-weight: 600; color: #333;">${comment.username}</span>
                            <span style="font-size: 12px; color: #999;">${new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <div style="color: #333; line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap;">${comment.content}</div>
                        <div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: #666;">
                            <button class="like-btn" onclick="toggleLike(${comment.id})" style="background: none; border: none; cursor: pointer; color: #666; display: flex; align-items: center;">
                                <i class="fas fa-heart"></i> <span style="margin-left: 5px;">${comment.likes}</span>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                commentsList.innerHTML = '<div class="empty-message">加载评论失败</div>';
            }
        })
        .catch(error => {
            console.error('加载评论失败:', error);
            commentsList.innerHTML = '<div class="empty-message">加载评论失败，请稍后重试</div>';
        });
}

// 全局函数 - 切换他人主页标签页
function switchOtherProfileTab(tabId, element) {
    // 切换标签页状态
    document.querySelectorAll('#otherProfileView .tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.borderBottom = '3px solid transparent';
        tab.style.color = '#666';
    });
    
    element.classList.add('active');
    element.style.borderBottom = '3px solid #667eea';
    element.style.color = '#667eea';
    
    // 切换内容
    document.querySelectorAll('#otherProfileView .tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.getElementById(tabId).style.display = 'block';
}

// 全局函数 - 显示主内容
function showMainContent() {
    // 隐藏我的主页视图
    const profileView = document.getElementById('profileView');
    if (profileView) {
        profileView.style.display = 'none';
    }
    
    // 隐藏他人主页视图
    const otherProfileView = document.getElementById('otherProfileView');
    if (otherProfileView) {
        otherProfileView.style.display = 'none';
    }
    
    // 清空搜索框内容
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 显示主内容区域
    document.querySelectorAll('section, footer, nav').forEach(element => {
        element.style.display = '';
        element.style.visibility = 'visible';
        element.style.opacity = '1';
    });
    
    // 确保主内容区域的显示
    document.body.style.display = '';
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    
    // 强制重置所有图片的显示
    document.querySelectorAll('img').forEach(img => {
        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.opacity = '1';
    });
    
    // 强制重置所有带有背景图片的元素
    document.querySelectorAll('div[style*="background-image"]').forEach(element => {
        element.style.display = '';
        element.style.visibility = 'visible';
        element.style.opacity = '1';
    });
    
    // 触发滚动事件，确保 AOS 动画正常显示
    window.dispatchEvent(new Event('scroll'));
}

// 全局函数 - 切换我的主页标签
function switchProfileTab(tabId, element) {
    // 移除所有标签的active类和样式
    document.querySelectorAll('#profileView .tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.borderBottom = '3px solid transparent';
        tab.style.color = '#666';
    });
    document.querySelectorAll('#profileView .tab-content').forEach(content => content.style.display = 'none');
    
    // 添加当前标签的active类和样式
    if (element) {
        element.classList.add('active');
        element.style.borderBottom = '3px solid #667eea';
        element.style.color = '#667eea';
    }
    document.getElementById(tabId).style.display = 'block';
    
    // 焦点管理：切换到点赞过的评论时清除输入框焦点
    if (tabId === 'liked-comments') {
        // 清除我发布的评论输入框的焦点
        const messageInput = document.getElementById('message');
        if (messageInput) {
            messageInput.blur();
        }
    }
    
    // 根据标签页ID加载对应内容
    if (tabId === 'my-comments') {
        loadMyComments();
    } else if (tabId === 'liked-comments') {
        loadLikedComments();
    }
}

// 全局函数 - 加载我发布的评论
function loadMyComments() {
    const commentsList = document.getElementById('myCommentsList');
    
    if (!currentUserId) {
        commentsList.innerHTML = '<div class="empty-message">请先登录</div>';
        return;
    }
    
    fetch(`/api/users/${currentUserId}/comments`)
        .then(response => response.json())
        .then(data => {
            console.log('加载我的评论响应:', data);
            if (data.status === 'success') {
                const comments = data.data || [];
                
                if (comments.length === 0) {
                    commentsList.innerHTML = '<div class="empty-message">你还没有发布过评论</div>';
                    return;
                }
                
                commentsList.innerHTML = comments.map(comment => `
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-weight: 600; color: #333;">${comment.username}</span>
                            <span style="font-size: 12px; color: #999;">${new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <div style="color: #333; line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap;">${comment.content}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #666;">
                            <button class="like-btn" onclick="toggleLike(${comment.id})" style="background: none; border: none; cursor: pointer; color: #666; display: flex; align-items: center;">
                                <i class="fas fa-heart"></i> <span style="margin-left: 5px;">${comment.likes}</span>
                            </button>
                            <button class="delete-btn" onclick="deleteComment(${comment.id})" style="background: none; border: none; cursor: pointer; color: #ff6b6b; display: flex; align-items: center;">
                                <i class="fas fa-trash-alt"></i> <span style="margin-left: 5px;">删除</span>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                commentsList.innerHTML = '<div class="empty-message">加载评论失败</div>';
            }
        })
        .catch(error => {
            commentsList.innerHTML = '<div class="empty-message">加载评论失败，请稍后重试</div>';
        });
}

// 全局函数 - 删除评论
function deleteComment(commentId) {
    if (!currentUserId) {
        alert('请先登录');
        return;
    }
    
    // 直接删除评论，不询问确认
    fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // 删除成功，重新加载评论列表
            loadMyComments();
            
            // 通知主页面的弹幕系统，移除被删除的评论
            if (typeof removeMessageFromBarrage === 'function') {
                removeMessageFromBarrage(commentId);
            }
            
            alert('评论删除成功');
        } else {
            alert('删除失败：' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        console.error('删除评论失败:', error);
        alert('删除失败，请稍后重试');
    });
}

// 全局函数 - 加载我点赞过的评论
function loadLikedComments() {
    const commentsList = document.getElementById('likedCommentsList');
    
    if (!currentUserId) {
        commentsList.innerHTML = '<div class="empty-message">请先登录</div>';
        return;
    }
    
    // 显示加载中
    commentsList.innerHTML = '<div class="empty-message" style="text-align: center; padding: 60px 0; color: #999; font-size: 16px;">加载中...</div>';
    
    fetch(`/api/users/${currentUserId}/liked-comments`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const comments = data.data || [];
                
                if (comments.length === 0) {
                    commentsList.innerHTML = '<div class="empty-message" style="text-align: center; padding: 60px 0; color: #999; font-size: 16px;">你还没有点赞过评论</div>';
                } else {
                    commentsList.innerHTML = comments.map(comment => `
                        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600; color: #333;">${comment.username}</span>
                                <span style="font-size: 12px; color: #999;">${new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                            <div style="color: #333; line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap;">${comment.content}</div>
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: #666;">
                                <button class="like-btn" onclick="toggleLike(${comment.id})" style="background: none; border: none; cursor: pointer; color: #ff4757; display: flex; align-items: center;">
                                    <i class="fas fa-heart"></i> <span style="margin-left: 5px;">${comment.likes}</span>
                                </button>
                            </div>
                        </div>
                    `).join('');
                }
                
                // 评论加载完成后滚动到点赞过的评论区域并设置焦点
                setTimeout(() => {
                    const likedCommentsList = document.getElementById('likedCommentsList');
                    if (likedCommentsList) {
                        // 考虑固定导航栏的高度，添加偏移量
                        const navbarHeight = document.querySelector('.navbar').offsetHeight;
                        const scrollPosition = likedCommentsList.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
                        window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
                        
                        // 设置焦点到点赞过的评论区域
                        likedCommentsList.setAttribute('tabindex', '-1');
                        likedCommentsList.focus();
                    }
                }, 100);
            } else {
                commentsList.innerHTML = '<div class="empty-message" style="text-align: center; padding: 60px 0; color: #999; font-size: 16px;">加载评论失败</div>';
            }
        })
        .catch(error => {
            console.error('加载评论失败:', error);
            commentsList.innerHTML = '<div class="empty-message" style="text-align: center; padding: 60px 0; color: #999; font-size: 16px;">加载评论失败，请稍后重试</div>';
        });
}

// 全局函数 - 横向弹幕样式（已合并到上方的 startMessageBarrage 函数）





// 全局函数 - 点赞
function toggleLike(id) {
    // 检查用户是否登录
    if (!currentUser || !currentUserId) {
        alert('请先登录');
        return;
    }
    
    // 如果 ID 是一个很大的时间戳（预览弹幕），不发送请求
    if (id > 1000000000000) {
        alert('该评论为预览内容，暂不支持点赞。请登录后发布正式评论。');
        return;
    }
    
    // 找到所有对应评论的点赞按钮，判断当前状态
    const likeButtons = document.querySelectorAll(`.like-btn[onclick="toggleLike(${id})"]`);
    
    // 更加健壮的状态判断：检查是否有红色心形图标或特定的颜色样式
    let isCurrentlyLiked = false;
    if (likeButtons.length > 0) {
        const btn = likeButtons[0];
        const heartIcon = btn.querySelector('i');
        // 检查 innerHTML 是否包含红心 Emoji，或者图标是否有红色类名/样式
        isCurrentlyLiked = btn.innerHTML.includes('❤️') || 
                          (heartIcon && (window.getComputedStyle(btn).color === 'rgb(255, 71, 87)' || btn.style.color === '#ff4757'));
    }
    
    // 根据当前状态决定是点赞还是取消点赞
    const endpoint = isCurrentlyLiked ? `/api/comments/${id}/unlike` : `/api/comments/${id}/like`;
    const actionName = isCurrentlyLiked ? '取消点赞' : '点赞';
    
    // 发送请求到后端
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: currentUserId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // 显示反馈
            showLikeFeedback(isCurrentlyLiked ? '已取消点赞' : '你给该评论点赞了');
            
            // 更新当前显示的评论点赞状态
            updateLikeStatus(id, !isCurrentlyLiked);
            
            // 如果是在“点赞过的评论”选项卡中取消点赞，立即刷新列表
            const likedTab = document.querySelector('.tab[onclick*="liked-comments"].active');
            if (isCurrentlyLiked && likedTab) {
                // 给一个小延迟，让用户看到爱心变色的动画后再刷新列表
                setTimeout(() => {
                    loadLikedComments();
                }, 300);
            }
        } else {
            alert(data.message || `${actionName}失败`);
        }
    })
    .catch(error => {
        console.error(`${actionName}错误:`, error);
        alert(`${actionName}失败，请稍后重试`);
    });
}

// 更新当前显示的评论点赞状态
function updateLikeStatus(id, isLiked) {
    // 找到所有对应评论的点赞按钮
    const likeButtons = document.querySelectorAll(`.like-btn[onclick="toggleLike(${id})"]`);
    likeButtons.forEach(button => {
        // 更新爱心图标和颜色，保持与原有样式一致
        if (isLiked) {
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.style.color = '#ff4757'; // 红色
        } else {
            button.innerHTML = '<i class="far fa-heart"></i>'; // 改用空心图标
            button.style.color = '#666'; // 灰色
        }
        
        // 更新旁边的数字（如果有的话）
        const likesCountSpan = button.nextElementSibling;
        if (likesCountSpan && likesCountSpan.tagName === 'SPAN') {
            let count = parseInt(likesCountSpan.textContent) || 0;
            likesCountSpan.textContent = isLiked ? count + 1 : Math.max(0, count - 1);
        }
    });
}

// 显示点赞反馈
function showLikeFeedback(message) {
    const feedback = document.createElement('div');
    feedback.style.position = 'fixed';
    feedback.style.top = '50%';
    feedback.style.left = '50%';
    feedback.style.transform = 'translate(-50%, -50%)';
    feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    feedback.style.color = 'white';
    feedback.style.padding = '10px 20px';
    feedback.style.borderRadius = '5px';
    feedback.style.zIndex = '1000';
    feedback.style.fontSize = '14px';
    feedback.textContent = message || '操作成功';
    
    document.body.appendChild(feedback);
    
    // 2秒后自动消失
    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (document.body.contains(feedback)) {
                document.body.removeChild(feedback);
            }
        }, 500);
    }, 2000);
}

// 英雄详细信息数据
const heroDetails = {
    liuhulan: {
        name: "刘胡兰",
        subtitle: "生的伟大，死的光荣",
        gridImage: "images/liuhulan1.jpg",
        image: "images/liuhulan.jpg",
        summary: "1947年，年仅15岁的刘胡兰在敌人的铡刀前高呼“怕死不当共产党”，用生命诠释了忠诚与信仰。",
        quote: "只要有一口气活着，就要为人民干到底。",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        background: "刘胡兰（1932年10月8日—1947年1月12日），原名刘富兰，山西省文水县云周西村（现改名为刘胡兰村）人。她是中国共产党候补党员（牺牲后追认正式党员），著名革命烈士。",
        life: "刘胡兰出生于贫苦农民家庭，父亲刘景谦，勤劳本分。4岁时母亲病逝，继母胡文秀心地善良，将其名'刘富兰'改为'刘胡兰'，并支持她参加革命。8岁上村小学，10岁（1942年）加入抗日救国儿童团。受八路军抗日活动与抗日民主政府影响，从小树立'共产党为穷人办事'的信念，常站岗、放哨、送情报、贴传单。1945年11月，13岁的刘胡兰参加中共文水县委'妇女干部训练班'，学习40余天，阶级觉悟快速提升。1946年，回村任云周西村妇救会秘书，发动妇女做军鞋、送公粮、动员青年参军；5月，调任第五区'抗联'妇女干事；6月，14岁被吸收为中共候补党员（未满18岁，按规定为候补期）；10月，国民党军进犯文水，她主动留下坚持敌后斗争，传递指示、掩埋粮食；12月，配合武工队处决为阎锡山军通风报信的反动村长石佩怀，引发敌人疯狂报复。1947年1月12日，因叛徒石五则（云周西村农会秘书）出卖，被国民党阎锡山军与地主武装'复仇自卫队'包围云周西村，将刘胡兰与石三槐等6人抓捕。当日共7人牺牲。面对敌人的威逼利诱，她坚贞不屈，敌人利诱说'自白就放你，给你土地'，刘胡兰怒斥：'你给我抬一个金人来，我也不自白！'敌人恐吓说'小小年纪，不怕死？'她坚定回答：'怕死不当共产党！'敌人在她面前用铡刀杀害6位群众，企图逼降。刘胡兰毫无惧色，主动问：'我咋个死法？'随后从容走向铡刀，自己躺在铡刀上，壮烈牺牲，年仅15岁（未满15周岁）。",
        contributions: "刘胡兰为了革命事业，献出了自己年轻的生命。她的事迹激励了无数革命志士，成为中国革命史上的英雄典范。她的精神鼓舞着一代又一代中国人为国家和民族的事业而奋斗。刘胡兰的事迹被广泛传播，成为中国革命精神的重要象征。她是中国共产党女烈士中年龄最小之一，展现了共产党员的坚定信仰和革命意志。",
        honors: "1947年8月1日，中共晋绥分局破格追认她为中国共产党正式党员（通常需满18岁转正）。1947年3月，毛泽东听闻事迹后，亲笔题词'生的伟大，死的光荣'，后因战乱遗失；1957年，在刘胡兰牺牲10周年之际，毛泽东再次题写同一题词。2009年，她入选'100位为新中国成立作出突出贡献的英雄模范人物'。刘胡兰纪念馆位于山西省文水县云周西村，是全国重点烈士纪念建筑保护单位。",
        evaluation: "刘胡兰是中华民族的英雄，她的事迹体现了共产党员的坚定信念和革命意志。她的精神已经成为中华民族宝贵的精神财富，激励着后人不断前进。刘胡兰的故事被写入中小学课本，成为青少年爱国主义教育的重要内容。她面对敌人的威逼利诱，始终坚贞不屈，展现了共产党员的崇高气节。针对网络上出现的'刘胡兰是被乡亲铡死'等不实传言，经权威史料与幸存见证人证实：当时敌人用枪托击打、强迫个别群众去动铡刀，但刘胡兰是主动走向铡刀，且牺牲于敌人手中，并非'死于乡亲之手'。战地记者赵戈（亲历者）证实，刘胡兰是在敌人威逼下从容就义，相关传言是对历史细节的歪曲和炒作。",
        artisticImage: "刘胡兰的事迹被改编成多种艺术形式，包括《刘胡兰传》（马烽著）、歌剧《刘胡兰》、电影《刘胡兰》等。这些作品使她的英雄形象深入人心，成为中国革命文学和艺术的重要题材。",
        lvliangSpirit: "刘胡兰的精神与吕梁精神高度契合。她体现了'对党忠诚、信念坚定、不怕牺牲、敢于胜利'的吕梁精神核心内涵。她的事迹是吕梁精神的生动诠释，激励着吕梁儿女在新时代继续传承和弘扬革命精神。刘胡兰是吕梁人民的骄傲，她的精神将永远激励着我们前进。'坚定信仰、宁死不屈、敢于担当'的刘胡兰精神，是吕梁精神的重要组成部分。" 
    },
    hechang: {
        name: "贺昌",
        subtitle: "吕梁走出的革命先驱",
        gridImage: "images/hechang1.jpg",
        image: "images/hechang.jpg",
        summary: "中共早期杰出的革命家，参与领导南昌起义，在战斗中英勇牺牲，时年29岁。",
        quote: "革命不怕死，怕死不革命。",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        background: "贺昌（1906年1月19日－1935年3月10日），原名贺颖，字伯聪，山西省柳林县（原属离石县）人，是中国共产党早期杰出的无产阶级革命家、政治家、军事家，人民军队政治工作的卓越领导人。",
        life: "1906年出生于柳林镇士绅家庭，自幼聪慧好学，喜读史书，少年时便写下'大丈夫不做岳飞死，也当做班超名震天下'的《壮志歌》，立下救国宏愿。1919年，13岁的贺昌积极参加五四运动。1920年，考入山西省立第一中学，结识高君宇等进步青年，开始系统学习马克思主义，并加入李大钊领导的马克思学说研究会（通信会员）。1921年5月，参与创建太原社会主义青年团，成为山西最早的共产主义组织成员。1922年9月，任太原团地委书记，领导驱逐反动校长魏日靖的学生运动，坚持半年取得胜利。1923年7月，由共青团转入中国共产党，成为山西早期党组织的重要创始人。1923年秋，调往上海团中央工作，后任团中央工农部长、劳动部长。1925年，参与领导五卅运动。1926年，任共青团湖北省委书记，在武汉领导青年运动。1927年，作为江浙区委负责人，参与组织上海工人三次武装起义。1927年4月，21岁当选中央委员，成为党史上最年轻的中央委员之一。1927年8月，任前敌军委委员，参与南昌起义组织工作。1927年12月，参与广州起义的组织准备。1928年，任湖南省委书记，恢复党组织，支援井冈山根据地。1929年，任广东省委书记，协助邓小平策划并领导百色起义。1930年春，任中共中央北方局书记，领导北方地区革命斗争，组织唐山兵变等武装暴动。1931年，进入中央革命根据地，历任红五军政委、红三军团政治部主任、红军总政治部副主任（代主任）。1934年1月，当选中华苏维埃共和国中央执行委员。1934年10月，中央红军长征，贺昌奉命留守，任中共中央分局委员、中央军区政治部主任，与项英、陈毅等领导苏区游击战争。1935年3月，苏区沦陷，贺昌率部向粤赣边突围。3月10日，在江西会昌归庄河畔遭国民党军伏击，身负重伤。战至最后一刻，宁死不屈，高呼'红军万岁'，举枪自戕，壮烈牺牲，年仅29岁。",
        contributions: "贺昌是山西党、团、工运的开创者，我党早期核心领导人之一，为人民军队政治工作奠定了重要基础。他首次提出'政治工作是红军的生命线'，极大加强了人民军队的政治建设。他参与指挥南雄、水口等战役，参加中央苏区第四、五次反'围剿'。他在白色恐怖下坚持斗争，为党的事业付出了宝贵生命。",
        honors: "贺昌的事迹被载入中国革命史册，成为后人学习的榜样。故乡山西柳林县设有贺昌中学、贺昌烈士陵园。江西会昌建有贺昌烈士纪念碑，纪念其英勇事迹。",
        evaluation: "贺昌是吕梁人民的骄傲，他的革命精神和崇高品德永远值得我们学习。他为了国家和民族的解放事业，献出了自己年轻的生命，他的精神将永远激励着我们前进。贺昌的事迹体现了共产党员的先进性和革命英雄主义精神。",
        artisticImage: "贺昌的事迹被写入多种党史资料和文学作品中。他的革命精神和崇高品德成为文艺创作的重要题材，激励着后人继承和发扬革命传统。贺昌的形象也出现在许多历史题材的影视作品中。",
        lvliangSpirit: "贺昌的精神是吕梁精神的重要组成部分。他体现了'对党忠诚、信念坚定、不怕牺牲、敢于胜利'的吕梁精神核心内涵。他的事迹激励着吕梁儿女在新时代继续为国家和民族的事业而奋斗。贺昌是吕梁革命精神的典范，他的精神将永远传承下去。"
    },
    mafeng: {
        name: "马烽",
        subtitle: "《吕梁英雄传》作者",
        gridImage: "images/mafeng1.jpg",
        image: "images/mafeng.png",
        summary: "著名作家，与西戎共同创作《吕梁英雄传》，记录了吕梁人民的抗日斗争事迹。",
        quote: "文学应该为人民服务，为时代服务。",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        background: "马烽（1922—2004），原名马书铭，笔名闫志吾、孔华联，山西孝义居义村人，出生于贫苦农民家庭，是中国当代著名作家、编剧，山药蛋派核心代表人物，更是扎根乡土、心系人民的'人民作家'。",
        life: "1922年，马烽出生于山西孝义农家，幼年丧父，家境困顿，年少辍学，历经生活磨难。1938年，年仅16岁的他投身抗日洪流，参加山西新军政卫队，从普通战士、班长，逐步转入文艺宣传工作，同年加入中国共产党，开启革命与文学并行的人生道路。1940年，他奔赴延安，进入鲁艺附设部队艺术干部训练班、部队艺术学校学习，从美术创作转向文学写作，深耕文艺创作功底。1942年，马烽参加延安文艺座谈会，聆听毛泽东同志关于文艺工作的重要讲话，彻底确立'为工农兵创作'的核心方向，同年发表处女作《第一次侦察》，正式登上文坛。1945至1946年，与西戎合著长篇小说《吕梁英雄传》，在解放区引发轰动，成为抗战文学的经典之作。此后，他历任《晋绥大众报》编辑、记者、主编，吕梁文化教育出版社总编辑，扎根晋绥边区，深入基层采访创作，记录抗战与土改时期的人民生活。新中国成立后，马烽曾任职于中央文学研究所、全国文协，1956年主动放弃京城工作，回到山西定居，长期深入吕梁、晋中农村，与农民同吃同住同劳动，积累海量创作素材。文革期间，他遭受迫害，创作被迫中断，但始终坚守文学初心与革命信仰。1978年，耗时多年、走访调研完成的《刘胡兰传》出版，成为记录革命烈士事迹的权威文学作品。改革开放后，他迎来创作又一高峰，多篇短篇小说斩获全国大奖，与孙谦合作的多部农村题材电影，成为新中国影视经典。晚年的马烽，先后担任山西省文联主席、中国作协党组书记、副主席等职，深耕文艺组织与青年人才培养工作，2004年1月31日在太原病逝，享年82岁，临终前仍在修改文学作品，将一生奉献给了人民文艺事业。",
        contributions: "马烽是中国当代农村题材文学的标杆人物，创作涵盖小说、剧本、传记等多个领域，作品始终聚焦农民生活、农村变迁与革命历程，兼具文学价值与历史价值。与西戎合著的《吕梁英雄传》，是解放区第一部长篇抗战小说，以章回体形式、通俗口语化的表达，真实再现吕梁山抗日民兵的英勇斗争，塑造了鲜活的英雄群像，成为抗战文学的里程碑；长篇传记《刘胡兰传》，历经实地走访、史料考证，真实还原刘胡兰烈士的成长历程与革命精神，兼具纪实性与文学性，成为全国爱国主义教育的核心范本；《我的第一个上级》《三年早知道》《结婚现场会》等短篇小说，以朴实幽默的语言、鲜活的人物刻画，反映农村发展与农民精神风貌，成为当代短篇文学的经典。作为山药蛋派核心奠基人之一，马烽与赵树理、西戎、孙谦等作家，共同开创了中国当代最具乡土特色的文学流派。他坚守'写农民、为农民写'的创作宗旨，作品语言通俗接地气、故事贴近农村生活、风格现实主义，摒弃晦涩难懂的表达，让文学真正走向普通群众，让农民看得懂、有共鸣。山药蛋派的创作理念，深刻影响了中国当代文学的发展方向，成为文学本土化、民族化、大众化的典范。马烽与孙谦合作创作的《我们村里的年轻人》《咱们的退伍兵》《泪痕》等电影剧本，聚焦农村建设、青年成长、时代变革，画面朴实、情感真挚，真实展现新中国农村的发展与农民的精神面貌，成为新中国农村题材影视的里程碑作品，斩获多项影视大奖，影响了几代观众，让乡土故事通过影视载体，走进千家万户。马烽一生致力于文艺事业的传承与发展，在山西牵头创办文学刊物、搭建创作平台，发起青年作家培训班，悉心指导、培养大批青年文学创作者，助力山西文学'晋军崛起'，成为山西文学发展的核心引领者。同时，他在全国文艺领导岗位上，始终坚守'深入生活、扎根人民'的创作导向，推动全国乡土文学与基层文艺的繁荣发展，为中国文艺事业培养了源源不断的后备力量。马烽一生扎根基层，不慕名利，始终与农民群众站在一起，用文字传递革命精神、乡土情怀与时代正能量。他将作品版权无偿捐赠给贫困地区，助力地方文化建设，用实际行动践行'人民作家'的初心，其创作精神与人格魅力，成为文艺工作者的榜样，也让吕梁红色精神、乡土精神得以广泛传承。",
        honors: "多篇短篇小说荣获全国优秀短篇小说奖，包括《结婚现场会》《葫芦沟今昔》等经典作品；与孙谦合作的电影《咱们的退伍兵》《泪痕》等，斩获中国电影金鸡奖、大众电影百花奖等重磅影视奖项；1992年，被山西省委、省政府授予'人民作家'荣誉称号，这是对他一生扎根人民、创作为民的最高赞誉；入选'100位新中国成立以来感动中国人物'候选名单，作品入选中小学语文教材、课外读物，成为爱国主义教育与文学教育的重要素材；当选第六、七届全国人大代表，担任中国文联副主席、中国作协副主席、山西省政协副主席等职务，荣获多项文艺界与国家级荣誉表彰。",
        evaluation: "马烽被誉为'中国农村历史的风雨表'，是当之无愧的'人民作家'，他的一生，始终与人民同心、与时代同行，用质朴的文字书写最真实的乡土与人民。文学界评价他，坚守现实主义创作道路，摒弃浮华与雕琢，以最接地气的语言、最鲜活的人物、最真实的故事，让文学回归生活、回归人民，是山药蛋派精神的忠实践行者与传承者，其作品兼具文学性、思想性与群众性，影响了中国几代文学创作者。业内与群众评价他，为人低调谦逊、淡泊名利，一生扎根农村，不慕城市繁华，与农民同吃同住，真正做到了从人民中来、到人民中去，其人格魅力与创作精神，成为文艺工作者的标杆。他的作品不仅记录了时代的变迁，更传递了信仰的力量，无论是抗战英雄、革命烈士，还是普通农民、基层干部，在他的笔下都有血有肉、充满温度，让红色精神与乡土情怀深深扎根于大众心中。",
        artisticImage: "马烽的作品被改编成多种艺术形式，如电影、电视剧、话剧等。其中，根据他的小说改编的电影《我们村里的年轻人》《泪痕》等都产生了广泛的影响。马烽的形象也出现在一些反映作家生活的影视作品中。",
        lvliangSpirit: "马烽的艺术形象，与吕梁精神深度契合、一脉相承，是吕梁精神在文艺领域的生动体现，二者相互交融、彼此成就。吕梁精神的核心是艰苦奋斗、顾全大局、无私奉献、勇于担当，而马烽的人生历程、创作理念与艺术形象，全方位诠释了这一精神内核。从生平来看，他生于吕梁、长于吕梁，年少投身革命，在艰苦的抗战岁月与基层生活中，始终坚守艰苦奋斗的品质，即便身处高位，仍放弃优渥生活，重回吕梁山区扎根，不惧苦难、甘于清贫，践行吕梁儿女的坚韧品格。从创作来看，马烽的所有艺术作品，均以吕梁山区为背景，以吕梁人民为原型，无论是《吕梁英雄传》中的抗日民兵，还是《刘胡兰传》中的革命烈士，亦或是农村题材作品中的普通农民，都是吕梁精神的具象化艺术形象。他用文字刻画吕梁人民在革命、建设、改革时期的奋斗历程，展现出吕梁人民顾全大局、无私奉献、勇于抗争的精神风貌，让抽象的吕梁精神，通过鲜活的艺术形象变得可感可知。同时，马烽自身的艺术创作形象，也丰富了吕梁精神的内涵：他扎根乡土、创作为民，是无私奉献的体现；他坚守初心、不惧迫害，是勇于担当的体现；他深耕基层、精益求精，是艰苦奋斗的体现。他的艺术创作，让吕梁精神从历史走向当下，从地域走向全国，而吕梁精神也为他的艺术创作提供了源源不断的灵感与灵魂，二者相辅相成，让马烽的艺术形象更具感染力，让吕梁精神得以永久传承、发扬光大。"
    },
    xirong: {
        name: "西戎",
        subtitle: "《吕梁英雄传》作者",
        gridImage: "images/xirong1.jpg",
        image: "images/xirong.jpg",
        summary: "著名作家，与马烽共同创作《吕梁英雄传》，为中国革命文学作出重要贡献。",
        quote: "真实是文学的生命。",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        background: "西戎（1922—2001），本名席诚正，山西蒲县人，山药蛋派代表作家之一，被誉为'人民作家'。他的一生与中国革命、农村变革紧密相连，作品充满浓郁的乡土气息与现实主义精神。",
        life: "1922年，生于山西蒲县西坡村一个贫苦农家，幼时放羊为生。高小毕业因家贫辍学，但酷爱读书，受堂兄影响，阅读鲁迅、古典名著，作文优异。笔名'西戎'，意为'西坡村的当兵人'。1938年，16岁参加牺盟会、吕梁剧社，以演剧、写标语宣传抗日。1940年，入党，赴延安鲁艺学习，接受系统文艺训练。1942年，发表处女作《我掉了队后》（《解放日报》），写亲身战斗经历。1944年，秧歌剧《王德锁减租》获晋绥文艺甲等奖。1945年，与马烽合著长篇小说《吕梁英雄传》，连载后轰动全国。建国后，历任《晋绥大众报》编辑、《火花》《汾水》主编、山西省作协主席、省文联副主席。1953年，挂职汾阳县委副书记，长期扎根农村。1962年，发表《赖大嫂》，塑造经典农村妇女形象，后遭批判。文革期间，被关'牛棚'，身心受创，被迫搁笔。1979年后，复出，扶持青年作家，推动'晋军崛起'。1992年，获山西省委、省政府授予'人民作家'称号。1994年离休，仍笔耕不辍。2001年1月6日病逝于太原，享年79岁。",
        contributions: "西戎是山药蛋派代表作家之一，与马烽合著的《吕梁英雄传》是中国第一部通俗抗战长篇，写吕梁山民兵反扫荡、斗地主，故事性强、语言通俗，影响极大，激励几代人，成为抗战文学经典。他的作品《赖大嫂》塑造经典农村妇女形象，《宋老大进城》写农民进城的质朴与幽默，语言鲜活、口语化、乡土味浓。他还创作了电影剧本《扑不灭的火焰》《黄土坡的婆姨们》等。西戎与赵树理、马烽并称'山药蛋派三驾马车'，奠定山西文学在中国文坛的地位。",
        honors: "1944年，秧歌剧《王德锁减租》获晋绥文艺甲等奖。1992年，获山西省委、省政府授予'人民作家'称号。",
        evaluation: "西戎是从抗日烽火中走出的人民作家。他以质朴的笔、火热的心、地道的乡土语言，书写了中国农村从抗战、土改到建国、改革的百年变迁。他的作品既是历史档案，也是文学经典，影响深远。他为人质朴，一生低调、真诚、接地气，被称'朴厚的山里娃'。他扶持后辈，培养李锐、韩石山、焦祖尧等作家，是山西文坛伯乐。他坚守人民性，始终扎根乡土、写人民、为人民，是'人民作家'的典范。",
        artisticImage: "西戎的作品被改编成多种艺术形式，如电影、电视剧、话剧等。其中，根据《吕梁英雄传》改编的影视作品影响广泛。西戎的形象也出现在一些反映作家生活的影视作品中。",
        lvliangSpirit: "西戎的精神与吕梁精神高度契合。他体现了'对党忠诚、信念坚定、不怕牺牲、敢于胜利'的吕梁精神核心内涵。他用文学作品诠释了吕梁精神，为吕梁文化的传承和发展作出了重要贡献。西戎是吕梁文化的杰出代表，他的精神将永远激励着吕梁儿女前进。"
    },
    zhangshuping: {
        name: "张叔平",
        subtitle: "吕梁革命先驱",
        gridImage: "images/zhangshuping1.jpg",
        image: "images/zhangshuping.jpg",
        summary: "吕梁地区早期党的领导人，为了革命事业，不畏艰险，英勇奋斗，为吕梁的革命事业作出了重要贡献。",
        quote: "革命是为了人民的幸福，我愿为此奋斗终身。",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        background: "张叔平（1897—1928），原名张秉铨，字叔平，山西省吕梁市离石区人，吕梁地区早期党的领导人，中国共产党的优秀党员，为了革命事业，不畏艰险，英勇奋斗，为吕梁的革命事业作出了重要贡献。",
        life: "1897年，张叔平出生于离石区一个普通家庭。他自幼勤奋好学，成绩优异。1919年，五四运动爆发后，他积极参加爱国学生运动，开始接触马克思主义。1922年，张叔平考入山西省立第一中学，在学校期间，他积极参加进步学生活动，组织读书会，宣传马克思主义。1923年，张叔平加入中国社会主义青年团，同年加入中国共产党，成为吕梁地区早期的共产党员之一。1925年，他受党组织派遣，回到山西开展革命工作，先后在太原、汾阳、离石等地建立党组织。1926年，张叔平被任命为中共山西省委委员，负责组织工作。他积极发展党员，建立党的基层组织，开展工人运动和农民运动。1927年，大革命失败后，张叔平继续在山西坚持地下斗争，组织工人罢工和农民暴动，反对国民党反动派的统治。1928年，由于叛徒出卖，张叔平不幸被捕。在敌人的严刑拷打下，他始终坚贞不屈，没有泄露党的任何机密。敌人对他进行了残酷的折磨，但他始终保持着共产党员的气节。最终，张叔平在太原英勇就义，年仅31岁。",
        contributions: "张叔平是吕梁地区早期党的领导人，为了革命事业，不畏艰险，英勇奋斗，为吕梁的革命事业作出了重要贡献。他在山西建立了多个党组织，发展了大批党员，组织了工人运动和农民运动，为中国革命的发展作出了重要贡献。他是吕梁地区党组织的创始人之一，为吕梁的革命事业奠定了坚实的基础。他的事迹激励着吕梁儿女为了国家和民族的解放事业而奋斗。",
        honors: "张叔平被追认为革命烈士，他的事迹被载入吕梁革命史册。离石区人民为了纪念他，在他的家乡建立了纪念碑，缅怀他的英雄事迹。1987年，离石县人民政府在县城中心建立了张叔平烈士纪念馆，展示他的革命事迹和精神。2009年，张叔平入选'100位为新中国成立作出突出贡献的英雄模范人物'候选人名单。",
        evaluation: "张叔平是吕梁人民的英雄，他的事迹体现了共产党员的坚定信念和革命意志。他为了国家和民族的解放事业，献出了自己年轻的生命，他的精神将永远激励着我们前进。张叔平的故事是吕梁精神的生动诠释，展现了吕梁儿女不怕牺牲、敢于胜利的英雄气概。他的革命精神和崇高品德永远值得我们学习。",
        artisticImage: "张叔平的事迹被写入多种革命史料和文学作品中。他的英雄形象也出现在一些反映革命历史的影视作品中，成为吕梁精神的重要象征。在吕梁地区，许多学校、街道以他的名字命名，以纪念这位革命先驱。",
        lvliangSpirit: "张叔平的精神与吕梁精神高度契合。他体现了'对党忠诚、信念坚定、不怕牺牲、敢于胜利'的吕梁精神核心内涵。他的事迹是吕梁精神的生动诠释，激励着吕梁儿女在新时代继续传承和弘扬革命精神。张叔平是吕梁人民的骄傲，他的精神将永远激励着我们前进。'坚定信仰、不怕牺牲、敢于担当'的张叔平精神，是吕梁精神的重要组成部分。" 
    },
    liuzhidan: {
        name: "刘志丹",
        subtitle: "西北红军和西北革命根据地的主要创建人之一",
        gridImage: "images/liuzhidan.jpg",
        image: "images/liuzhidan.jpg",
        summary: "中国工农红军高级将领，虽籍贯陕西，但1936年红军东征时牺牲于吕梁柳林县三交镇，被誉为“血洒吕梁山的民族英雄”。‌‌‌",
        quote: "为了中国革命的胜利，我愿献出自己的一切。",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        background: "刘志丹（1903年10月4日—1936年4月14日），字子丹，陕西保安（今志丹县）人，中国工农红军高级将领，西北红军和西北革命根据地的主要创建人之一。",
        life: "1903年，刘志丹出生于陕西保安县（今志丹县）一个书香门第家庭。1922年，考入榆林中学，受到进步思想影响，开始参加革命活动。1924年，加入中国社会主义青年团。1925年，加入中国共产党，同年秋，入黄埔军校第四期学习。1926年，毕业后参加北伐战争。1927年，大革命失败后，回到陕西从事地下工作，组织领导渭华起义。1928年，参与创建渭华起义根据地，任西北工农革命军军事委员会主席。1930年，任陕北特委军委书记，领导创建陕北红军和革命根据地。1932年，创建中国工农红军第二十六军，任军长。1934年，与谢子长领导的陕北红军会师，成立西北革命军事委员会，任主席。1935年，率部迎接中央红军北上，为中央红军在陕北立足作出了重要贡献。1936年，率部参加东征战役，在山西中阳县三交镇战斗中英勇牺牲，年仅33岁。",
        contributions: "刘志丹是西北红军和西北革命根据地的主要创建人之一，为中国革命作出了重要贡献。他领导创建了陕北革命根据地，为中央红军提供了立足之地，为中国革命的胜利奠定了基础。他提出了'狡兔三窟'的游击战术，为中国革命的军事理论作出了重要贡献。他的军事思想和战略战术，对中国革命的胜利产生了深远影响。",
        honors: "刘志丹牺牲后，中共中央和毛泽东高度评价他的革命功绩。1936年，中共中央决定将保安县改名为志丹县，以纪念他的革命功绩。1943年，在志丹县修建了刘志丹烈士陵园。1989年，刘志丹被中央军委确定为33位军事家之一。2009年，刘志丹入选'100位为新中国成立作出突出贡献的英雄模范人物'。",
        evaluation: "刘志丹是中国共产党的优秀党员，是中国工农红军的杰出将领，是西北红军和西北革命根据地的主要创建人之一。他为了中国革命的胜利，献出了自己年轻的生命，他的精神将永远激励着我们前进。刘志丹的故事是中国革命精神的生动诠释，展现了中国共产党人不怕牺牲、敢于胜利的英雄气概。他的革命精神和崇高品德永远值得我们学习。",
        artisticImage: "刘志丹的事迹被写入多种革命史料和文学作品中。他的英雄形象也出现在一些反映革命历史的影视作品中，成为中国革命精神的重要象征。在陕西志丹县，建有刘志丹烈士陵园和纪念馆，展示他的革命事迹和精神。",
        lvliangSpirit: "刘志丹的精神与吕梁精神高度契合。他体现了'对党忠诚、信念坚定、不怕牺牲、敢于胜利'的吕梁精神核心内涵。他的事迹是吕梁精神的生动诠释，激励着吕梁儿女在新时代继续传承和弘扬革命精神。刘志丹是中国革命的英雄，他的精神将永远激励着我们前进。'坚定信仰、不怕牺牲、敢于担当'的刘志丹精神，是吕梁精神的重要组成部分。" 
    },
};

// Markdown转HTML函数
function markdownToHtml(markdown) {
    // 处理标题
    markdown = markdown.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    markdown = markdown.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    markdown = markdown.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    
    // 处理粗体
    markdown = markdown.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // 处理列表
    markdown = markdown.replace(/^- (.*$)/gim, '<li>$1</li>');
    markdown = markdown.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 处理段落
    markdown = markdown.replace(/^(?!<h[1-3]>)(?!<li>)(?!<ul>)(.*$)/gim, '<p>$1</p>');
    
    // 处理换行
    markdown = markdown.replace(/\n/gim, '<br>');
    
    return markdown;
}

// 打开英雄详情模态框
function openHeroModal(heroId) {
    const modal = document.getElementById('heroModal');
    const modalBody = document.getElementById('heroModalBody');
    const hero = heroDetails[heroId];
    
    if (hero) {
        // 构建模态框内容，移除视频部分以避免服务不可用问题
        let content = `
            <h2>${hero.name}</h2>
            <p class="hero-subtitle">${hero.subtitle}</p>
            
            <!-- 人物图片 -->
            <div class="hero-image-container" style="text-align: center; margin-bottom: 2rem;">
                <img src="${hero.image}" alt="${hero.name}" style="max-width: 100%; max-height: 400px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            </div>
            
            <div class="hero-detail-section">
                <h3>人物背景</h3>
                <div>${markdownToHtml(hero.background)}</div>
            </div>
            
            <div class="hero-detail-section">
                <h3>生平</h3>
                <div>${markdownToHtml(hero.life)}</div>
            </div>
            
            <div class="hero-detail-section">
                <h3>伟大贡献</h3>
                <p>${hero.contributions}</p>
            </div>
            
            <div class="hero-detail-section">
                <h3>荣誉</h3>
                <div>${markdownToHtml(hero.honors)}</div>
            </div>
            
            <div class="hero-detail-section">
                <h3>人物评价</h3>
                <div>${markdownToHtml(hero.evaluation)}</div>
            </div>
            
            <div class="hero-detail-section">
                <h3>艺术形象</h3>
                <p>${hero.artisticImage}</p>
            </div>
            
            <div class="hero-detail-section">
                <h3>与吕梁精神的关联</h3>
                <p>${hero.lvliangSpirit}</p>
            </div>
        `;
        
        modalBody.innerHTML = content;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// 关闭英雄详情模态框
function closeHeroModal() {
    const modal = document.getElementById('heroModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('heroModal');
    if (event.target == modal) {
        closeHeroModal();
    }
};

// ===== 加载动画关闭（放在 document.addEventListener 外面） =====
window.addEventListener('load', function() {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }, 800);
    }
});

// ===== 手风琴式轮播卡片效果 =====
function initAccordion() {
    const accordionCards = document.querySelectorAll('.accordion-card');
    
    accordionCards.forEach(card => {
        card.addEventListener('click', function() {
            // 移除所有卡片的active类
            accordionCards.forEach(c => c.classList.remove('active'));
            // 添加当前卡片的active类
            this.classList.add('active');
        });
    });
}

// 页面加载完成后初始化手风琴
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccordion);
} else {
    initAccordion();
}
