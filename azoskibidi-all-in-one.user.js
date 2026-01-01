// ==UserScript==
// @name         AzoSkibidi All-in-One
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Loading screen + Parse câu hỏi + AI Solver - Tất cả trong 1!
// @author       AzoSkibidi Team
// @match        https://*.azota.vn/*
// @match        http://*.azota.vn/*
// @match        file:///*
// @updateURL    https://github.com/laiduc1312209/AzoSkibidi/raw/refs/heads/main/azoskibidi-all-in-one.user.js
// @downloadURL  https://github.com/laiduc1312209/AzoSkibidi/raw/refs/heads/main/azoskibidi-all-in-one.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      api.groq.com
// @connect      discord.com
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ============================================
    // CONFIG
    // ============================================
    const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
    const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1354675643731804291/RRgZx8Q78VUyBl_nqXejmRbCdAQJyqlWpIJc1cE4FA1q__kjLINdaaE8kHYrnL5IMHEQ';
    // 🔑 API KEY sẽ được người dùng nhập qua UI
    let API_KEY = GM_getValue('groq_api_key', '');
    
    // 🛑 Control flags
    let isSolverRunning = false;
    let shouldStopSolver = false;
    
    // ============================================
    // HELPERS
    // ============================================
    // Kiểm tra có phải trang làm bài không
    const isExamPage = () => {
        // Check URL có chứa /doing/ hoặc có questions trong DOM
        const urlHasExam = window.location.href.includes('/doing/');
        const hasQuestions = document.querySelectorAll('[id^="question_all_"]').length > 0;
        return urlHasExam || hasQuestions;
    };

    // ============================================
    // PART 1: LOADING SCREEN
    // ============================================
    const loadingStyle = document.createElement('style');
    loadingStyle.textContent = `
        #azoskibidi-loading {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: linear-gradient(135deg, #1a0033 0%, #2d1b4e 50%, #1a0033 100%);
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            z-index: 999999; font-family: 'Segoe UI', sans-serif; animation: fadeIn 0.5s;
        }
        .loading-title {
            font-size: 48px; font-weight: 700;
            background: linear-gradient(45deg, #b794f6, #e879f9, #c084fc);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            margin-bottom: 20px; animation: glow 2s ease-in-out infinite;
        }
        .loading-subtitle { font-size: 24px; color: #d8b4fe; margin-bottom: 40px; animation: pulse 2s ease-in-out infinite; }
        .spinner {
            width: 60px; height: 60px; border: 5px solid rgba(192, 132, 252, 0.2);
            border-top: 5px solid #c084fc; border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes glow { 0%, 100% { filter: drop-shadow(0 0 10px rgba(183, 148, 246, 0.5)); } 50% { filter: drop-shadow(0 0 20px rgba(232, 121, 249, 0.8)); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-out { animation: fadeOut 0.5s forwards; }
    `;
    document.documentElement.appendChild(loadingStyle);

    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'azoskibidi-loading';
    loadingScreen.innerHTML = `
        <div class="loading-title">AzoSkibidi</div>
        <div class="loading-subtitle">Vibe coding by pld_1312</div>
        <div class="spinner"></div>
    `;
    document.documentElement.appendChild(loadingScreen);

    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.remove();
                loadingStyle.remove();
            }, 500);
        }, 1000);
    });

    // ============================================
    // PART 2: TEXT FINDER
    // ============================================
    const findAndLogText = async () => {
        // Tìm elements với class="px-2 ng-star-inserted"
        const px2Elements = document.querySelectorAll('.px-2.ng-star-inserted');
        
        if (px2Elements.length > 0) {
            const studentNames = [];
            px2Elements.forEach((el) => {
                const text = el.textContent.trim();
                if (text) {
                    studentNames.push(text);
                }
            });
            
            if (studentNames.length > 0) {
                // Hiển thị thông báo chào mừng kết hợp với nhập API
                await showWelcomeNotification(studentNames[0]); // Lấy tên đầu tiên
                
                // Gửi Discord
                sendToDiscord(studentNames);
            }
        }
    };
    
    // Hiển thị thông báo chào mừng kết hợp với config API
    const showWelcomeNotification = async (studentName) => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ai-solver-overlay';
            
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: linear-gradient(145deg, rgba(88, 28, 135, 0.95), rgba(59, 7, 100, 0.98));
                backdrop-filter: blur(20px);
                color: white; padding: 50px 60px; border-radius: 24px;
                box-shadow: 0 25px 80px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
                z-index: 999999; font-family: 'Segoe UI', Tahoma, system-ui, sans-serif;
                animation: welcomeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                text-align: center; min-width: 500px; max-width: 550px;
            `;
            
            // Fix: Kiểm tra API key chặt chẽ hơn
            const hasApiKey = API_KEY && API_KEY.trim().length > 0;
            console.log('🔍 Debug - API_KEY value:', API_KEY);
            console.log('🔍 Debug - hasApiKey:', hasApiKey);
            
            notification.innerHTML = `
                <button class="modal-close-btn" id="welcome-close" style="
                    position: absolute; top: 20px; right: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 28px; width: 40px; height: 40px;
                    border-radius: 50%; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-weight: 300; line-height: 1;
                ">×</button>
                
                <div style="font-size: 64px; margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(167, 139, 250, 0.3));">🎓</div>
                
                <div style="
                    font-size: 36px; font-weight: 700; margin-bottom: 12px;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                    letter-spacing: -0.5px;
                    line-height: 1.2;
                ">Chào mừng đến với AzoSkibidi</div>
                
                <div style="
                    font-size: 20px; font-weight: 500; 
                    color: #e9d5ff; margin-bottom: 35px;
                    opacity: 0.95;
                ">${studentName}</div>
                
                ${!hasApiKey ? `
                    <div style="
                        border-top: 1px solid rgba(255, 255, 255, 0.15);
                        padding-top: 30px; margin-top: 25px;
                    ">
                        <p style="
                            margin-bottom: 20px; color: #f3e8ff;
                            font-size: 16px; font-weight: 500;
                        ">🤖 Nhập Groq API Key để kích hoạt AI Solver</p>
                        
                        <input type="password" id="welcome-api-input" placeholder="Paste API key ở đây..." 
                            style="
                                width: 100%; padding: 14px 16px;
                                border: 2px solid rgba(167, 139, 250, 0.4);
                                background: rgba(17, 24, 39, 0.4);
                                color: #fff; border-radius: 12px;
                                margin-bottom: 12px; font-size: 15px;
                                transition: all 0.3s;
                                font-family: 'Consolas', 'Monaco', monospace;
                            " />
                        
                        <p style="
                            font-size: 13px; color: #d8b4fe;
                            margin-bottom: 18px;
                        ">
                            Nhận API miễn phí tại: <a href="https://console.groq.com/keys" target="_blank" style="
                                color: #fbbf24; font-weight: 600;
                                text-decoration: underline;
                                text-decoration-color: rgba(251, 191, 36, 0.4);
                            ">Groq Console</a>
                        </p>
                        
                        <button id="welcome-save-api" style="
                            width: 100%; padding: 14px 20px;
                            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                            border: none; border-radius: 12px;
                            color: #fff; font-weight: 600; cursor: pointer;
                            font-size: 15px;
                            box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
                            transition: all 0.3s;
                        ">
                            ✨ Kiểm tra & Lưu
                        </button>
                        
                        <div id="welcome-api-status" style="display: none; margin-top: 14px;"></div>
                    </div>
                ` : `
                    <div style="
                        margin-top: 25px; padding: 20px 24px;
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.12));
                        border: 1px solid rgba(16, 185, 129, 0.3);
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
                    ">
                        <div style="font-size: 20px; color: #6ee7b7; font-weight: 600; margin-bottom: 6px;">
                            ✅ API Key đã sẵn sàng!
                        </div>
                        <div style="font-size: 14px; color: #d1fae5; opacity: 0.9; margin-bottom: 15px;">
                            Sử dụng nút AI Solver để giải câu hỏi tự động
                        </div>
                        <button id="clear-api-key" style="
                            width: 100%; padding: 10px;
                            background: rgba(239, 68, 68, 0.15);
                            border: 1px solid rgba(239, 68, 68, 0.3);
                            border-radius: 10px;
                            color: #fca5a5;
                            font-size: 13px;
                            cursor: pointer;
                            transition: all 0.3s;
                        ">
                            🗑️ Xóa API Key & Nhập lại
                        </button>
                    </div>
                `}
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes welcomeIn {
                    from { 
                        transform: translate(-50%, -50%) scale(0.8) translateY(20px);
                        opacity: 0;
                    }
                    to { 
                        transform: translate(-50%, -50%) scale(1) translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes welcomeOut {
                    from { 
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    to { 
                        transform: translate(-50%, -50%) scale(0.9);
                        opacity: 0;
                    }
                }
                #welcome-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                    color: white;
                }
                #welcome-api-input:focus {
                    outline: none;
                    border-color: rgba(167, 139, 250, 0.8);
                    background: rgba(17, 24, 39, 0.6);
                    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
                }
                #welcome-save-api:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 24px rgba(139, 92, 246, 0.5);
                }
                #welcome-save-api:active {
                    transform: translateY(0);
                }
                #welcome-save-api:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(overlay);
            document.body.appendChild(notification);
            
            const closeBtn = notification.querySelector('#welcome-close');
            const closeNotification = () => {
                notification.style.animation = 'welcomeOut 0.4s ease-out';
                setTimeout(() => {
                    notification.remove();
                    overlay.remove();
                    style.remove();
                    resolve();
                }, 400);
            };
            
            closeBtn.onclick = closeNotification;
            
            if (!hasApiKey) {
                const input = notification.querySelector('#welcome-api-input');
                const saveBtn = notification.querySelector('#welcome-save-api');
                const statusDiv = notification.querySelector('#welcome-api-status');
                
                saveBtn.onclick = async () => {
                    const key = input.value.trim();
                    if (!key) {
                        statusDiv.style.cssText = `
                            display: block; margin-top: 14px; padding: 12px;
                            border-radius: 10px; font-size: 14px; text-align: center;
                            background: rgba(239, 68, 68, 0.15);
                            border: 1px solid rgba(239, 68, 68, 0.3);
                            color: #fca5a5;
                        `;
                        statusDiv.textContent = '⚠️ Vui lòng nhập API Key!';
                        return;
                    }
                    
                    input.disabled = true;
                    saveBtn.disabled = true;
                    saveBtn.textContent = '🔄 Đang kiểm tra...';
                    statusDiv.style.cssText = `
                        display: block; margin-top: 14px; padding: 12px;
                        border-radius: 10px; font-size: 14px; text-align: center;
                        background: rgba(139, 92, 246, 0.15);
                        border: 1px solid rgba(139, 92, 246, 0.3);
                        color: #c4b5fd;
                    `;
                    statusDiv.textContent = '⏳ Đang kiểm tra API Key...';
                    
                    const result = await testApiKey(key);
                    
                    if (result.success) {
                        statusDiv.style.cssText = `
                            display: block; margin-top: 14px; padding: 12px;
                            border-radius: 10px; font-size: 14px; text-align: center;
                            background: rgba(16, 185, 129, 0.15);
                            border: 1px solid rgba(16, 185, 129, 0.3);
                            color: #6ee7b7;
                        `;
                        statusDiv.textContent = '✅ API Key hợp lệ! Đang lưu...';
                        
                        API_KEY = key;
                        GM_setValue('groq_api_key', key);
                        
                        setTimeout(closeNotification, 1500);
                    } else {
                        statusDiv.style.cssText = `
                            display: block; margin-top: 14px; padding: 12px;
                            border-radius: 10px; font-size: 14px; text-align: center;
                            background: rgba(239, 68, 68, 0.15);
                            border: 1px solid rgba(239, 68, 68, 0.3);
                            color: #fca5a5;
                        `;
                        statusDiv.textContent = `❌ Lỗi: ${result.error}`;
                        input.disabled = false;
                        saveBtn.disabled = false;
                        saveBtn.textContent = '✨ Kiểm tra & Lưu';
                    }
                };
                
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') saveBtn.click();
                });
            } else {
                // Xử lý nút xóa API key
                const clearBtn = notification.querySelector('#clear-api-key');
                if (clearBtn) {
                    clearBtn.onclick = () => {
                        if (confirm('Bạn có chắc muốn xóa API Key đã lưu?')) {
                            GM_setValue('groq_api_key', '');
                            API_KEY = '';
                            alert('✅ Đã xóa API Key! Trang sẽ tải lại...');
                            location.reload();
                        }
                    };
                }
                
                // KHÔNG tự động đóng - người dùng phải click X để đóng
            }
        });
    };
    
    // ============================================
    // FLOATING SETTINGS BUTTON
    // ============================================
    const createFloatingSettingsButton = () => {
        const floatingBtn = document.createElement('button');
        floatingBtn.id = 'azoskibidi-floating-settings';
        floatingBtn.innerHTML = '⚙️';
        floatingBtn.style.cssText = `
            position: fixed; bottom: 90px; right: 20px;
            width: 56px; height: 56px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border: none; border-radius: 50%;
            color: white; font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
            z-index: 999996;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; align-items: center; justify-content: center;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            #azoskibidi-floating-settings:hover {
                transform: translateY(-3px) rotate(90deg);
                box-shadow: 0 6px 28px rgba(99, 102, 241, 0.6);
            }
            #azoskibidi-floating-settings:active {
                transform: translateY(-1px) rotate(90deg);
            }
        `;
        document.head.appendChild(style);
        
        floatingBtn.onclick = async () => {
            // Check xem modal đã mở chưa
            const existingModal = document.querySelector('.ai-solver-overlay');
            if (existingModal) {
                console.log('Modal đang mở rồi, không làm gì');
                return;
            }
            
            // Tìm tên học sinh nếu có
            const px2Elements = document.querySelectorAll('.px-2.ng-star-inserted');
            let studentName = 'Bạn';
            if (px2Elements.length > 0) {
                studentName = px2Elements[0].textContent.trim() || 'Bạn';
            }
            
            await showWelcomeNotification(studentName);
        };
        
        document.body.appendChild(floatingBtn);
        console.log('⚙️ Floating settings button created!');
    };
    
    // ============================================
    // MINI CONSOLE UI
    // ============================================
    const consoleLogs = [];
    let consoleUI = null;
    let consoleVisible = false;
    
    const addConsoleLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString('vi-VN');
        consoleLogs.push({ time: timestamp, message, type });
        if (consoleLogs.length > 50) consoleLogs.shift(); // Keep last 50 logs
        
        if (consoleUI) {
            updateConsoleDisplay();
        }
    };
    
    const updateConsoleDisplay = () => {
        const logContainer = document.getElementById('azoskibidi-console-logs');
        if (!logContainer) return;
        
        logContainer.innerHTML = consoleLogs.map(log => {
            const colorMap = {
                info: '#a5b4fc',
                success: '#6ee7b7',
                error: '#fca5a5',
                warning: '#fcd34d'
            };
            return `<div style="margin-bottom: 4px; font-size: 12px; color: ${colorMap[log.type] || '#a5b4fc'};">
                <span style="opacity: 0.6;">[${log.time}]</span> ${log.message}
            </div>`;
        }).join('');
        
        logContainer.scrollTop = logContainer.scrollHeight;
    };
    
    const createMiniConsole = () => {
        consoleUI = document.createElement('div');
        consoleUI.id = 'azoskibidi-console';
        consoleUI.style.cssText = `
            position: fixed; bottom: 20px; left: 20px;
            width: 400px; max-height: 300px;
            background: linear-gradient(145deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.98));
            backdrop-filter: blur(12px);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            z-index: 999995;
            display: ${consoleVisible ? 'block' : 'none'};
            font-family: 'Consolas', 'Monaco', monospace;
            overflow: hidden;
        `;
        
        consoleUI.innerHTML = `
            <div style="padding: 12px 16px; border-bottom: 1px solid rgba(139, 92, 246, 0.2); display: flex; justify-content: space-between; align-items: center;">
                <div style="color: #c4b5fd; font-weight: 600; font-size: 13px;">📊 Console Log</div>
                <button id="console-close" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 11px;">Đóng</button>
            </div>
            <div id="azoskibidi-console-logs" style="padding: 12px; max-height: 240px; overflow-y: auto; font-size: 12px; color: #e2e8f0;"></div>
        `;
        
        document.body.appendChild(consoleUI);
        
        document.getElementById('console-close').onclick = () => {
            consoleVisible = false;
            consoleUI.style.display = 'none';
        };
        
        // Console toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'console-toggle';
        toggleBtn.innerHTML = '📊';
        toggleBtn.style.cssText = `
            position: fixed; bottom: 160px; right: 20px;
            width: 56px; height: 56px;
            background: linear-gradient(135deg, #0891b2, #0e7490);
            border: none; border-radius: 50%;
            color: white; font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(8, 145, 178, 0.5);
            z-index: 999996;
            transition: all 0.3s;
            display: flex; align-items: center; justify-content: center;
        `;
        
        toggleBtn.onclick = () => {
            consoleVisible = !consoleVisible;
            consoleUI.style.display = consoleVisible ? 'block' : 'none';
        };
        
        const style = document.createElement('style');
        style.textContent = `
            #console-toggle:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 28px rgba(8, 145, 178, 0.6);
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(toggleBtn);
        
        addConsoleLog('Mini console initialized', 'success');
    };
    
    // Hàm gửi tên học sinh đến Discord
    const sendToDiscord = (studentNames) => {
        const message = {
            content: `🎓 **Tên học sinh phát hiện:**\n${studentNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}`,
            username: 'AzoSkibidi Bot',
            avatar_url: 'https://i.imgur.com/4M34hi2.png'
        };
        
        GM_xmlhttpRequest({
            method: 'POST',
            url: DISCORD_WEBHOOK_URL,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(message),
            onload: (response) => {
                if (response.status === 204 || response.status === 200) {
                    console.log('✅ Đã gửi tên học sinh đến Discord!');
                } else {
                    console.error('❌ Lỗi gửi Discord:', response.status, response.responseText);
                }
            },
            onerror: (error) => {
                console.error('❌ Lỗi kết nối Discord:', error);
            }
        });
    };

    // ============================================
    // PART 3: AI SOLVER STYLES
    // ============================================

    const aiStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .ai-solver-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, #1a0033, #2d1b4e, #1a0033); padding: 30px; border-radius: 15px; box-shadow: 0 8px 32px rgba(157, 78, 221, 0.4); z-index: 999999; min-width: 400px; color: #fff; }
            .ai-solver-modal h2 { color: #9d4edd; margin-bottom: 20px; font-size: 24px; }
            .ai-solver-modal input { width: 100%; padding: 12px; border: 2px solid #9d4edd; background: rgba(255,255,255,0.1); color: #fff; border-radius: 8px; margin-bottom: 15px; }
            .ai-solver-modal button { width: 100%; padding: 12px; background: linear-gradient(45deg, #9d4edd, #c77dff); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; transition: transform 0.2s; }
            .ai-solver-modal button:hover { transform: scale(1.05); }
            .ai-solver-modal button:disabled { opacity: 0.5; cursor: not-allowed; }
            .modal-close-btn { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.1); border: none; color: #fff; font-size: 24px; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
            .modal-close-btn:hover { background: rgba(255,255,255,0.2); transform: rotate(90deg); }
            .api-status { margin-top: 10px; padding: 10px; border-radius: 8px; font-size: 14px; text-align: center; }
            .api-status.success { background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #6ee7b7; }
            .api-status.error { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; }
            .ai-solver-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 999998; }
            .ai-solve-btn { position: fixed; bottom: 20px; right: 20px; background: linear-gradient(45deg, #9d4edd, #c77dff); color: white; border: none; padding: 15px 30px; border-radius: 50px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(157, 78, 221, 0.4); z-index: 999997; transition: all 0.3s; }
            .ai-solve-btn:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(157, 78, 221, 0.6); }
            .ai-solve-btn.loading { opacity: 0.7; cursor: wait; }
            .ai-answer-badge { display: inline-block; background: linear-gradient(45deg, #10b981, #059669); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-left: 10px; font-size: 14px; animation: fadeInScale 0.5s; }
            @keyframes fadeInScale { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
            .ai-correct-answer { background: rgba(16, 185, 129, 0.2) !important; border: 2px solid #10b981 !important; animation: pulse 1s; }
            @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
            .ai-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-left: 10px; }
        `;
        document.head.appendChild(style);
    };

    // ============================================
    // PART 4: API KEY VALIDATION
    // ============================================
    const testApiKey = async (apiKey) => {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: GROQ_API_ENDPOINT,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                data: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 5
                }),
                timeout: 10000,
                onload: (response) => {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.error) {
                            resolve({ success: false, error: data.error.message });
                        } else if (data.choices && data.choices.length > 0) {
                            resolve({ success: true });
                        } else {
                            resolve({ success: false, error: 'Invalid response format' });
                        }
                    } catch (error) {
                        resolve({ success: false, error: 'Failed to parse response' });
                    }
                },
                onerror: () => {
                    resolve({ success: false, error: 'Network error' });
                },
                ontimeout: () => {
                    resolve({ success: false, error: 'Request timeout' });
                }
            });
        });
    };

    const showApiKeyModal = (canClose = true) => {
        return new Promise((resolve, reject) => {
            const overlay = document.createElement('div');
            overlay.className = 'ai-solver-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'ai-solver-modal';
            modal.innerHTML = `
                ${canClose ? '<button class="modal-close-btn" id="close-modal">×</button>' : ''}
                <h2>🤖 AzoSkibidi AI Solver</h2>
                <p style="margin-bottom: 15px; color: #ddd;">Nhập Groq API Key để sử dụng tính năng AI:</p>
                <input type="password" id="groq-api-input" placeholder="Nhập Groq API Key..." value="${API_KEY}" />
                <p style="font-size: 12px; color: #999; margin-bottom: 15px;">Lấy miễn phí: <a href="https://console.groq.com/keys" target="_blank" style="color: #9d4edd;">Groq Console</a></p>
                <button id="save-api-key">Kiểm tra & Lưu</button>
                <div id="api-status" class="api-status" style="display: none;"></div>
            `;
            
            document.body.appendChild(overlay);
            document.body.appendChild(modal);
            
            const input = modal.querySelector('#groq-api-input');
            const saveBtn = modal.querySelector('#save-api-key');
            const statusDiv = modal.querySelector('#api-status');
            const closeBtn = modal.querySelector('#close-modal');
            
            // Close button handler
            if (closeBtn && canClose) {
                closeBtn.onclick = () => {
                    overlay.remove();
                    modal.remove();
                    reject('User closed modal');
                };
            }
            
            // Save button handler
            saveBtn.onclick = async () => {
                const key = input.value.trim();
                if (!key) {
                    statusDiv.className = 'api-status error';
                    statusDiv.textContent = '⚠️ Vui lòng nhập API Key!';
                    statusDiv.style.display = 'block';
                    return;
                }
                
                // Disable input and button during validation
                input.disabled = true;
                saveBtn.disabled = true;
                saveBtn.textContent = '🔄 Đang kiểm tra...';
                statusDiv.className = 'api-status';
                statusDiv.textContent = '⏳ Đang kiểm tra API Key...';
                statusDiv.style.display = 'block';
                
                // Test API key
                const result = await testApiKey(key);
                
                if (result.success) {
                    statusDiv.className = 'api-status success';
                    statusDiv.textContent = '✅ API Key hợp lệ! Đang lưu...';
                    
                    API_KEY = key;
                    GM_setValue('groq_api_key', key);
                    
                    setTimeout(() => {
                        overlay.remove();
                        modal.remove();
                        resolve(key);
                    }, 1000);
                } else {
                    statusDiv.className = 'api-status error';
                    statusDiv.textContent = `❌ Lỗi: ${result.error}`;
                    input.disabled = false;
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Kiểm tra & Lưu';
                }
            };
            
            input.focus();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveBtn.click();
            });
        });
    };

    // ============================================
    // PART 5: GROQ API CALL (WITH RETRY) - SIMPLIFIED
    // ============================================
    const callGroqAPI = async (rawContent, questionElement, retryCount = 0) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 5000; // 5 giây
        
        // PROMPT với Chain-of-Thought để AI suy nghĩ kỹ hơn
        const prompt = `Bạn là chuyên gia giải câu hỏi trắc nghiệm Việt Nam (Toán, Lý, Hóa, Sinh, Văn, Sử, Địa...). 

📋 NỘI DUNG CÂU HỎI (RAW TEXT):
${rawContent}

🎯 QUY TRÌNH LÀM BÀI (BẮT BUỘC):

**BƯỚC 1: PHÂN TÍCH CÂU HỎI**
- Đọc kỹ đề bài, xác định môn học (Toán/Lý/Hóa/Sinh/Văn/Sử/Địa...)
- Chú ý công thức: H₂O, x², [H⁺], log₂, ∫, Σ, CO₂, pH, √, ∆, π
- Chú ý ký hiệu: ≈, ≤, ≥, →, ⇌, ±, ×, ÷
- Chú ý số: phân số, số mũ, chỉ số trên/dưới

**BƯỚC 2: XÁC ĐỊNH LOẠI CÂU HỎI**
- ĐÚNG/SAI NHIỀU Ý: có a), b), c), d) + mỗi ý có [Đúng][Sai]
- TRẮC NGHIỆM: có đáp án A, B, C, D (hoặc A, B, C)
- ĐÚNG/SAI đơn: chỉ 2 lựa chọn Đúng/Sai
- TRẢ LỜI NGẮN: không có đáp án cho trước

**BƯỚC 3: SUY LUẬN LOGIC**
- Áp dụng kiến thức chuyên môn (công thức, định lý, quy tắc)
- Loại trừ đáp án SAI
- Xác định đáp án ĐÚNG nhất
- Kiểm tra lại tính logic

**BƯỚC 4: TRẢ LỜI**
CHỈ trả về JSON thuần (KHÔNG thêm \`\`\`json, KHÔNG giải thích thêm):

- Multi True/False: {"type":"multi_tf","answer":{"a":"Đúng","b":"Sai","c":"Đúng","d":"Sai"}} (Keys phải là a, b, c, d thường)
- Multiple Choice: {"type":"mc","answer":"A"}
- Single True/False: {"type":"tf","answer":"Đúng"} hoặc {"type":"tf","answer":"A"}
- Short Answer: {"type":"short","answer":"câu trả lời"}

⚠️ LƯU Ý QUAN TRỌNG:
1. ĐỌC KỸ TỪNG CHỮ - đừng đọc lướt!
2. Với câu Toán/Lý/Hóa: KIỂM TRA CÔNG THỨC từng bước
3. Với câu Văn/Sử/Địa: CHÚ Ý chi tiết lịch sử, văn phong
4. Với câu Sinh: CHÚ Ý tên khoa học, cơ chế sinh học
5. Nếu không chắc chắn 100%: chọn đáp án có logic nhất

💡 VÍ DỤ:

Câu 1: "Đạo hàm của hàm số y = x² là:
A. x   B. 2x   C. x²   D. 2"

Phân tích: Toán - Đạo hàm. Công thức: (x^n)' = n*x^(n-1)
→ (x²)' = 2*x^(2-1) = 2x
→ {"type":"mc","answer":"B"}

Câu 2: "Trong H₂SO₄, số oxi hóa của S là:
A. +4   B. +6   C. -2   D. +2"

Phân tích: Hóa học - Số oxi hóa
H₂SO₄: H(+1), O(-2), S(?)
→ 2*(+1) + x + 4*(-2) = 0
→ 2 + x - 8 = 0
→ x = +6
→ {"type":"mc","answer":"B"}

BẮT ĐẦU TRẢ LỜI (CHỈ JSON):`;

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: GROQ_API_ENDPOINT,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                data: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1,  // Giảm xuống để tăng độ chính xác
                    max_tokens: 800    // Tăng lên để AI có đủ không gian phân tích kỹ
                }),
                onload: async (response) => {
                    try {
                        const data = JSON.parse(response.responseText);
                        
                        // Kiểm tra lỗi từ API
                        if (data.error) {
                            const errorMsg = data.error.message;
                            
                            // Nếu bị rate limit và còn retry
                            if (errorMsg.includes('RATE_LIMIT') || errorMsg.includes('quota')) {
                                if (retryCount < MAX_RETRIES) {
                                    const waitTime = RETRY_DELAY * (retryCount + 1);
                                    console.warn(`⏳ Rate limit! Đợi ${waitTime/1000}s rồi thử lại... (lần ${retryCount + 1}/${MAX_RETRIES})`);
                                    await new Promise(r => setTimeout(r, waitTime));
                                    
                                    // Retry
                                    try {
                                        const result = await callGroqAPI(questionText, answers, questionType, retryCount + 1);
                                        resolve(result);
                                        return;
                                    } catch (err) {
                                        reject(err);
                                        return;
                                    }
                                } else {
                                    console.error('❌ Vượt quá số lần thử lại!');
                                    reject('Rate limit - Vui lòng đợi vài phút');
                                    return;
                                }
                            }
                            
                            console.error('❌ Groq API Error:', errorMsg);
                            reject(`API Error: ${errorMsg}`);
                            return;
                        }
                        
                        // Kiểm tra có choices không
                        if (!data.choices || data.choices.length === 0) {
                            console.error('❌ No choices in response:', data);
                            reject('API không trả về kết quả. Kiểm tra API Key!');
                            return;
                        }
                        
                        // Lấy câu trả lời từ AI
                        const answer = data.choices[0].message.content.trim();
                        
                        try {
                            // Parse JSON response
                            const jsonMatch = answer.match(/\{[\s\S]*\}/);
                            if (!jsonMatch) {
                                console.warn('⚠️ AI không trả về JSON:', answer);
                                reject('AI không trả về JSON hợp lệ');
                                return;
                            }
                            
                            const parsed = JSON.parse(jsonMatch[0]);
                            console.log('✅ AI Response:', parsed);
                            
                            // Validate response structure
                            if (!parsed.type || !parsed.answer) {
                                reject('JSON thiếu field type hoặc answer');
                                return;
                            }
                            
                            resolve(parsed);
                        } catch (err) {
                            console.error('❌ Lỗi parse JSON:', err, 'Response:', answer);
                            reject('Lỗi parse JSON: ' + err.message);
                        }
                    } catch (error) {
                        console.error('❌ Parse error:', error);
                        console.error('Response:', response.responseText);
                        reject(`Lỗi xử lý: ${error.message}`);
                    }
                },
                onerror: (error) => {
                    console.error('❌ Request error:', error);
                    reject('Lỗi kết nối API');
                }
            });
        });
    };

    // ============================================
    // PART 6: QUESTION PARSER - SIMPLIFIED
    // ============================================
    const parseQuestions = () => {
        const questionElements = document.querySelectorAll('[id^="question_all_"]');
        const questions = [];

        questionElements.forEach((questionEl, index) => {
            try {
                const questionLabel = questionEl.querySelector('.question-standalone-label');
                const questionNumber = questionLabel ? questionLabel.textContent.trim() : `Câu ${index + 1}`;
                
                // ĐƠN GIẢN: Chỉ lấy toàn bộ text content
                const rawContent = questionEl.textContent.replace(/\s+/g, ' ').trim();

                // Kiểm tra có nội dung không
                if (!rawContent || rawContent.length < 10) {
                    console.warn(`⚠️ Câu ${questionNumber} không có nội dung`);
                    return;
                }
                
                // Lưu vào mảng
                questions.push({
                    element: questionEl,
                    number: questionNumber,
                    rawContent: rawContent
                });
            } catch (error) {
                console.error(`Error parsing question ${index + 1}:`, error);
                addConsoleLog(`❌ Lỗi parse câu ${index + 1}`, 'error');
            }
        });

        return questions;
    };

    // ============================================
    // PART 7: ANSWER HIGHLIGHTER
    // ============================================
    const highlightAnswer = (questionElement, answerLetter) => {
        const answerDivs = questionElement.querySelectorAll('.item-answer');
        
        answerDivs.forEach(answerDiv => {
            const button = answerDiv.querySelector('button');
            const letter = button ? button.textContent.trim() : '';
            
            if (letter === answerLetter) {
                answerDiv.classList.add('ai-correct-answer');
                
                const questionLabel = questionElement.querySelector('.question-standalone-label');
                if (questionLabel && !questionLabel.querySelector('.ai-answer-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'ai-answer-badge';
                    badge.textContent = `AI: ${answerLetter}`;
                    questionLabel.appendChild(badge);
                }
            }
        });
    };
    
    // Highlight cho Multi-statement True/False
    const highlightMultiStatement = (questionElement, answersJson) => {
        // answersJson = {"a": "Đúng", "b": "Sai", "c": "Đúng", "d": "Sai"}
        const answerDivs = questionElement.querySelectorAll('.item-answer');
        
        answerDivs.forEach(answerDiv => {
            const answerContent = answerDiv.querySelector('.answer-content');
            if (!answerContent) return;
            
            // Extract label (a, b, c, d)
            const fullText = answerContent.textContent.trim();
            // Regex linh hoạt hơn: bắt a), a., A), A.
            const labelMatch = fullText.match(/^([a-dA-D])[\.\)]/);
            if (!labelMatch) return;
            
            const label = labelMatch[1].toLowerCase(); // Chuẩn hóa về a, b, c, d
            const correctAnswer = answersJson[label]; // "Đúng" hoặc "Sai"
            
            if (!correctAnswer) return;
            
            // Tìm button tương ứng
            const buttons = answerDiv.querySelectorAll('button');
            buttons.forEach(button => {
                const buttonText = button.textContent.trim();
                // So sánh case-insensitive
                if (buttonText.toLowerCase() === correctAnswer.toLowerCase()) {
                    // Click vào button đúng
                    button.classList.add('ai-correct-answer');
                    button.style.cssText = `
                        background: rgba(16, 185, 129, 0.3) !important;
                        border: 2px solid #10b981 !important;
                        color: #6ee7b7 !important;
                        font-weight: bold !important;
                    `;
                    
                    // Auto click (optional - comment nếu không muốn tự động click)
                    setTimeout(() => button.click(), 100);
                }
            });
        });
        
        // Add badge
        const questionLabel = questionElement.querySelector('.question-standalone-label');
        if (questionLabel && !questionLabel.querySelector('.ai-answer-badge')) {
            const badge = document.createElement('span');
            badge.className = 'ai-answer-badge';
            const summary = Object.entries(answersJson).map(([key, val]) => `${key.toUpperCase()}:${val}`).join(' ');
            badge.textContent = `AI: ${summary}`;
            questionLabel.appendChild(badge);
        }
    };

    // ============================================
    // PART 8: MAIN SOLVER
    // ============================================
    const solveAllQuestions = async (button) => {
        // Nếu đang chạy, dừng lại
        if (isSolverRunning) {
            shouldStopSolver = true;
            button.innerHTML = '⏹️ Đang dừng...';
            button.disabled = true;
            addConsoleLog('⏹️ Người dùng yêu cầu dừng solver', 'warning');
            return;
        }
        
        if (!API_KEY) {
            alert('⚠️ Chưa có API Key! Vui lòng nhập API Key trước.');
            addConsoleLog('❌ Thiếu API Key', 'error');
            return;
        }

        const questions = parseQuestions();
        
        if (questions.length === 0) {
            alert('Không tìm thấy câu hỏi!');
            addConsoleLog('❌ Không tìm thấy câu hỏi', 'error');
            return;
        }

        isSolverRunning = true;
        shouldStopSolver = false;
        button.classList.add('loading');
        button.innerHTML = '🛑 Dừng lại';
        
        addConsoleLog(`📚 Bắt đầu giải ${questions.length} câu hỏi`, 'info');

        for (let i = 0; i < questions.length; i++) {
            if (shouldStopSolver) {
                addConsoleLog('⏹️ Đã dừng solver', 'warning');
                break;
            }
            
            const q = questions[i];
            
            try {
                addConsoleLog(`🔍 Đang xử lý ${q.number}...`, 'info');
                
                // Gửi raw content cho AI
                const result = await callGroqAPI(q.rawContent, q.element);
                
                addConsoleLog(`✅ ${q.number}: Type=${result.type}, Answer=${JSON.stringify(result.answer)}`, 'success');
                
                // Xử lý theo loại câu hỏi AI trả về
                if (result.type === 'multi_tf') {
                    // Multi-statement True/False
                    highlightMultiStatement(q.element, result.answer);
                    addConsoleLog(`✅ Đã chọn: ${JSON.stringify(result.answer)}`, 'success');
                } else if (result.type === 'short') {
                    // Short answer
                    const inputField = q.element.querySelector('input[type="text"], textarea');
                    if (inputField) {
                        inputField.value = result.answer;
                        inputField.dispatchEvent(new Event('input', { bubbles: true }));
                        addConsoleLog(`📝 Đã điền: "${result.answer}"`, 'info');
                    }
                } else if (result.type === 'mc' || result.type === 'tf') {
                    // Multiple choice hoặc true/false đơn
                    highlightAnswer(q.element, result.answer);
                }
                
                if (i < questions.length - 1 && !shouldStopSolver) {
                    await new Promise(resolve => setTimeout(resolve, 3000)); // Đợi 3s
                }
            } catch (error) {
                const errorMsg = `❌ Lỗi ${q.number}: ${error}`;
                addConsoleLog(errorMsg, 'error');
                console.error(errorMsg);
            }
        }

        isSolverRunning = false;
        shouldStopSolver = false;
        button.classList.remove('loading');
        button.disabled = false;
        
        if (shouldStopSolver) {
            button.innerHTML = '🤖 Giải tất cả câu hỏi';
        } else {
            button.innerHTML = '✨ Giải xong!';
            addConsoleLog('🎉 Hoàn thành tất cả câu hỏi!', 'success');
            
            setTimeout(() => {
                button.innerHTML = '🤖 Giải tất cả câu hỏi';
            }, 3000);
        }
    };

    // ============================================
    // PART 9: INIT AI SOLVER
    // ============================================
    const initAI = () => {
        aiStyles();

        // Nút giải câu hỏi
        const solveButton = document.createElement('button');
        solveButton.className = 'ai-solve-btn';
        solveButton.innerHTML = '🤖 Giải tất cả câu hỏi';
        solveButton.onclick = () => solveAllQuestions(solveButton);
        
        document.body.appendChild(solveButton);
        console.log('🎯 AzoSkibidi AI Solver sẵn sàng!');
    };

    // ============================================
    // START
    // ============================================
    setTimeout(async () => {
        const onExamPage = isExamPage();
        
        // Tạo floating settings button CHỈ KHI không phải trang làm bài
        if (!onExamPage) {
            createFloatingSettingsButton();
        }
        
        // Tạo mini console nếu đang trong trang làm bài
        if (onExamPage) {
            createMiniConsole();
            addConsoleLog('🎯 AzoSkibidi đã sẵn sàng', 'success');
        }
        
        // Tìm tên học sinh
        const px2Elements = document.querySelectorAll('.px-2.ng-star-inserted');
        let studentName = 'Bạn';
        let foundStudent = false;
        
        if (px2Elements.length > 0) {
            const names = [];
            px2Elements.forEach((el) => {
                const text = el.textContent.trim();
                if (text) {
                    names.push(text);
                }
            });
            
            if (names.length > 0) {
                studentName = names[0];
                foundStudent = true;
                // Gửi Discord
                sendToDiscord(names);
            }
        }
        
        // Chỉ hiển thị welcome screen NẾU:
        // - KHÔNG PHẢI trang làm bài
        // - VÀ (tìm thấy tên sinh viên HOẶC chưa có API key)
        if (!onExamPage && (foundStudent || !API_KEY || API_KEY.trim().length === 0)) {
            await showWelcomeNotification(studentName);
        }
        
        // Init AI solver nếu có câu hỏi
        const questions = parseQuestions();
        if (questions.length > 0) {
            initAI();
            if (onExamPage) {
                addConsoleLog(`✅ Phát hiện ${questions.length} câu hỏi`, 'info');
            }
        }
    }, 2000);

})();

