class DiaryManager {
    constructor() {
        this.entries = [];
        this.diaries = [];
        this.currentDate = new Date().toISOString().split('T')[0];
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.updateDisplay();
        this.updateStats();
    }

    bindEvents() {
        // 新增記錄按鈕
        const addRecordBtn = document.querySelector('.btn-primary');
        if (addRecordBtn) {
            addRecordBtn.addEventListener('click', () => {
                this.showAddEntryModal();
            });
        }

        // AI生成日記按鈕
        const generateBtn = document.querySelector('.btn-ai');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateDiary();
            });
        }
        
        // 全局函數綁定（用於HTML中的onclick）
        window.generateDiary = () => {
            this.generateDiary();
        };
        
        window.showAddEntryModal = () => {
            this.showAddEntryModal();
        };
        
        window.closeAddEntryModal = () => {
            this.closeModal(document.getElementById('addEntryModal'));
        };
        
        // 表單提交事件
        const entryForm = document.getElementById('entryForm');
        if (entryForm) {
            entryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addEntryFromModal();
            });
         }
         
         // 心情選擇器事件
         document.querySelectorAll('.mood-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                 e.preventDefault();
                 // 移除其他按鈕的active狀態
                 document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                 // 添加當前按鈕的active狀態
                 btn.classList.add('active');
                 // 更新隱藏的input值
                 const hiddenInput = document.getElementById('selectedMood');
                 if (hiddenInput) {
                     hiddenInput.value = btn.dataset.mood;
                 }
             });
         });

         // 查看歷史按鈕
        const historyBtn = document.querySelector('.btn-outline');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.showHistoryModal();
            });
        }

        // 導出自傳按鈕
        const exportBtn = document.querySelector('.btn-secondary');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showExportModal();
            });
        }

        // 模態框關閉
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // 點擊模態框外部關閉
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // 導出功能
        const exportAutobiographyBtn = document.getElementById('exportAutobiographyBtn');
        if (exportAutobiographyBtn) {
            exportAutobiographyBtn.addEventListener('click', () => {
                this.exportAutobiography();
            });
        }

        // 新增記錄表單提交
        const addEntryForm = document.getElementById('addEntryForm');
        if (addEntryForm) {
            addEntryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addEntryFromModal();
            });
        }

        // 心情選擇器事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mood-btn')) {
                // 移除其他選中狀態
                document.querySelectorAll('.mood-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                // 添加當前選中狀態
                e.target.classList.add('active');
            }
        });
    }

    showAddEntryModal() {
        const modal = document.getElementById('addEntryModal');
        if (modal) {
            modal.classList.add('show');
            // 設置當前時間
            const timeInput = document.getElementById('entryTime');
            if (timeInput) {
                const now = new Date();
                timeInput.value = now.toTimeString().slice(0, 5);
            }
        }
    }

    addEntryFromModal() {
        console.log('開始添加記錄從模態框');
        const timeInput = document.getElementById('entryTime');
        const contentInput = document.getElementById('entryContent');
        const selectedMoodInput = document.getElementById('selectedMood');
        const activeMoodBtn = document.querySelector('.mood-btn.active');
        
        const time = timeInput?.value || new Date().toTimeString().slice(0, 5);
        const content = contentInput?.value?.trim();
        const mood = activeMoodBtn ? activeMoodBtn.textContent : (selectedMoodInput?.value || '😊');
        
        console.log('表單數據:', { time, content, mood });
        
        if (!content) {
            this.showNotification('請輸入記錄內容', 'error');
            return;
        }

        const entry = {
            id: Date.now(),
            text: content,
            time: time,
            mood: mood,
            timestamp: new Date().toISOString(),
            date: this.currentDate
        };

        this.entries.push(entry);
        this.saveData();
        this.updateDisplay();
        this.updateStats();
        
        // 關閉模態框並重置表單
        this.closeModal(document.getElementById('addEntryModal'));
        if (contentInput) contentInput.value = '';
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
        // 重置為默認心情
        if (selectedMoodInput) selectedMoodInput.value = '😊';
        const defaultMoodBtn = document.querySelector('.mood-btn[data-mood="😊"]');
        if (defaultMoodBtn) defaultMoodBtn.classList.add('active');
    }

    addEntry() {
        const input = document.getElementById('entryInput');
        const text = input.value.trim();
        
        if (!text) {
            this.showNotification('請輸入內容', 'error');
            return;
        }

        const entry = {
            id: Date.now(),
            text: text,
            time: new Date().toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            timestamp: new Date().toISOString(),
            date: this.currentDate
        };

        this.entries.push(entry);
        input.value = '';
        this.saveData();
        this.updateDisplay();
        this.updateStats();
    }

    deleteEntry(id) {
        this.entries = this.entries.filter(entry => entry.id !== id);
        this.saveData();
        this.updateDisplay();
        this.updateStats();
        this.showNotification('條目已刪除', 'success');
    }

    updateDisplay() {
        const container = document.querySelector('.today-entries');
        const aiSection = document.getElementById('aiGenerateSection');
        if (!container) return;
        
        const todayEntries = this.entries.filter(entry => entry.date === this.currentDate);
        
        if (todayEntries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-pen-alt"></i>
                    <p>今天還沒有記錄，開始寫下你的第一個條目吧！</p>
                </div>
            `;
            // 隱藏AI生成按鈕
            if (aiSection) aiSection.style.display = 'none';
            return;
        }

        container.innerHTML = todayEntries.map(entry => `
            <div class="entry-item">
                <div class="entry-content">
                    <div class="entry-text">${this.escapeHtml(entry.text)}</div>
                    <div class="entry-time">
                        ${entry.time}
                        ${entry.mood ? `<span class="entry-mood">${entry.mood}</span>` : ''}
                    </div>
                </div>
                <div class="entry-actions">
                    <button class="btn btn-danger btn-small" onclick="diaryManager.deleteEntry(${entry.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // 顯示AI生成按鈕
        if (aiSection) aiSection.style.display = 'block';
    }



    async generateDiary() {
        const todayEntries = this.entries.filter(entry => entry.date === this.currentDate);
        
        if (todayEntries.length === 0) {
            this.showNotification('今天還沒有任何記錄，請先添加一些條目', 'error');
            return;
        }

        const btn = document.querySelector('.btn-ai');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="loading-spinner"></span> 生成中...';
        btn.disabled = true;

        try {
            // 模擬AI生成過程
            await this.delay(2000);
            
            const diary = this.createDiaryFromEntries(todayEntries);
            this.displayGeneratedDiary(diary);
            this.showNotification('日記生成成功！', 'success');
        } catch (error) {
            this.showNotification('生成失敗，請重試', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    createDiaryFromEntries(entries) {
        const date = new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        const systemPrompt = `你是一個專業的日記寫作助手。請根據用戶提供的今日活動記錄，寫一篇溫馨、真實、有感情的日記。

寫作要求：
1. 用第一人稱書寫
2. 語調自然親切，像在和朋友分享
3. 適當加入情感描述和內心感受
4. 結構清晰，有開頭、過程和感悟
5. 字數控制在200-400字之間
6. 體現出這一天的意義和價值

今日活動記錄：
${entries.map((entry, index) => `${index + 1}. ${entry.text} (${entry.time})`).join('\n')}`;

        // 這裡是模擬的AI生成內容，實際應用中可以接入真實的AI API
        const templates = [
            `${date}

今天又是充實的一天。${this.generateDiaryContent(entries)}\n\n回想起今天的點點滴滴，心中滿懷感激。每一個平凡的時刻都值得被記錄，因為它們構成了我獨特的人生故事。明天又是新的開始，期待更多美好的發生。`,
            
            `${date}\n\n時間過得真快，又到了一天的尾聲。${this.generateDiaryContent(entries)}\n\n這些看似平常的事情，卻讓我感受到生活的美好。每一天都是獨一無二的，每一個經歷都在塑造著更好的自己。感謝今天的所有遇見和體驗。`,
            
            `${date}\n\n今天的生活節奏很不錯。${this.generateDiaryContent(entries)}\n\n雖然都是些日常的事情，但正是這些平凡的瞬間組成了我們豐富的人生。每一天都在成長，每一天都有新的收穫。希望明天也能保持這樣積極的心態。`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    generateDiaryContent(entries) {
        const activities = entries.map(entry => entry.text);
        const timeRanges = this.categorizeByTime(entries);
        
        let content = '';
        
        if (timeRanges.morning.length > 0) {
            content += `早上${timeRanges.morning.map(e => e.text).join('，')}。`;
        }
        
        if (timeRanges.afternoon.length > 0) {
            content += `下午的時候${timeRanges.afternoon.map(e => e.text).join('，')}。`;
        }
        
        if (timeRanges.evening.length > 0) {
            content += `晚上${timeRanges.evening.map(e => e.text).join('，')}。`;
        }
        
        // 添加一些情感描述
        const emotions = [
            '感覺很充實',
            '心情不錯',
            '很有成就感',
            '覺得很滿足',
            '感到很開心'
        ];
        
        content += `整體來說，${emotions[Math.floor(Math.random() * emotions.length)]}。`;
        
        return content;
    }

    categorizeByTime(entries) {
        const morning = [];
        const afternoon = [];
        const evening = [];
        
        entries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            if (hour < 12) {
                morning.push(entry);
            } else if (hour < 18) {
                afternoon.push(entry);
            } else {
                evening.push(entry);
            }
        });
        
        return { morning, afternoon, evening };
    }

    displayGeneratedDiary(diary) {
        const container = document.getElementById('generatedDiary');
        const content = document.getElementById('diaryContent');
        
        content.textContent = diary;
        container.classList.add('show');
        
        // 存儲生成的日記以便保存
        this.currentGeneratedDiary = diary;
    }

    saveDiary() {
        if (!this.currentGeneratedDiary) {
            this.showNotification('沒有可保存的日記', 'error');
            return;
        }

        const diary = {
            id: Date.now(),
            date: this.currentDate,
            content: this.currentGeneratedDiary,
            entries: this.entries.filter(entry => entry.date === this.currentDate),
            createdAt: new Date().toISOString()
        };

        // 檢查是否已存在今天的日記
        const existingIndex = this.diaries.findIndex(d => d.date === this.currentDate);
        if (existingIndex !== -1) {
            this.diaries[existingIndex] = diary;
            this.showNotification('今日日記已更新', 'success');
        } else {
            this.diaries.push(diary);
            this.showNotification('日記已保存', 'success');
        }

        this.saveData();
        this.updateStats();
        
        // 隱藏生成的日記區域
        document.getElementById('generatedDiary').classList.remove('show');
        this.currentGeneratedDiary = null;
    }

    showHistoryModal() {
        const modal = document.getElementById('historyModal');
        const container = document.getElementById('diaryList');
        
        if (this.diaries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>還沒有保存的日記，快去生成第一篇吧！</p>
                </div>
            `;
        } else {
            const sortedDiaries = [...this.diaries].sort((a, b) => new Date(b.date) - new Date(a.date));
            container.innerHTML = sortedDiaries.map(diary => `
                <div class="diary-item" onclick="diaryManager.viewDiary('${diary.id}')">
                    <div class="diary-date">${new Date(diary.date).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                    })}</div>
                    <div class="diary-preview">${this.escapeHtml(diary.content.substring(0, 150))}...</div>
                </div>
            `).join('');
        }
        
        this.showModal(modal);
    }

    viewDiary(diaryId) {
        const diary = this.diaries.find(d => d.id == diaryId);
        if (!diary) return;
        
        const modal = document.getElementById('viewDiaryModal');
        document.getElementById('viewDiaryDate').textContent = new Date(diary.date).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        document.getElementById('viewDiaryContent').textContent = diary.content;
        
        this.closeModal(document.getElementById('historyModal'));
        this.showModal(modal);
    }

    showExportModal() {
        const modal = document.getElementById('exportModal');
        
        // 設置默認日期範圍
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        document.getElementById('startDate').value = startDate;
        document.getElementById('endDate').value = endDate;
        
        this.showModal(modal);
    }

    exportAutobiography() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            this.showNotification('請選擇日期範圍', 'error');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            this.showNotification('開始日期不能晚於結束日期', 'error');
            return;
        }

        const filteredDiaries = this.diaries.filter(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate >= new Date(startDate) && diaryDate <= new Date(endDate);
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (filteredDiaries.length === 0) {
            this.showNotification('選定日期範圍內沒有日記', 'error');
            return;
        }

        const autobiography = this.generateAutobiography(filteredDiaries, startDate, endDate);
        this.downloadFile(autobiography, `我的自傳_${startDate}_${endDate}.txt`);
        
        this.closeModal(document.getElementById('exportModal'));
        this.showNotification(`成功導出 ${filteredDiaries.length} 篇日記`, 'success');
    }

    generateAutobiography(diaries, startDate, endDate) {
        const title = `我的自傳\n${startDate} 至 ${endDate}\n`;
        const separator = '='.repeat(50);
        
        let content = `${title}\n${separator}\n\n`;
        content += `這是我人生中一段珍貴的記錄，從 ${new Date(startDate).toLocaleDateString('zh-TW')} 到 ${new Date(endDate).toLocaleDateString('zh-TW')}，共 ${diaries.length} 天的生活點滴。\n\n`;
        content += `${separator}\n\n`;
        
        diaries.forEach((diary, index) => {
            content += `第 ${index + 1} 篇\n`;
            content += `${diary.content}\n\n`;
            content += '-'.repeat(30) + '\n\n';
        });
        
        content += `${separator}\n`;
        content += `總結：這 ${diaries.length} 天的記錄見證了我的成長與變化，每一天都是獨特而珍貴的。感謝這些美好的時光，也期待未來更多精彩的故事。\n\n`;
        content += `導出時間：${new Date().toLocaleString('zh-TW')}\n`;
        
        return content;
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    updateStats() {
        const todayCount = this.entries.filter(entry => entry.date === this.currentDate).length;
        const totalDiaries = this.diaries.length;
        const totalEntries = this.entries.length;
        
        // 計算連續記錄天數
        const consecutiveDays = this.calculateConsecutiveDays();
        
        // 使用data-stat屬性選擇器更新統計
        const todayEl = document.querySelector('[data-stat="today"]');
        const diariesEl = document.querySelector('[data-stat="diaries"]');
        const entriesEl = document.querySelector('[data-stat="entries"]');
        const streakEl = document.querySelector('[data-stat="streak"]');
        
        if (todayEl) todayEl.textContent = todayCount;
        if (diariesEl) diariesEl.textContent = totalDiaries;
        if (entriesEl) entriesEl.textContent = totalEntries;
        if (streakEl) streakEl.textContent = consecutiveDays;
    }

    calculateConsecutiveDays() {
        if (this.diaries.length === 0) return 0;
        
        const sortedDates = [...new Set(this.diaries.map(d => d.date))].sort().reverse();
        let consecutive = 0;
        let currentDate = new Date();
        
        for (const dateStr of sortedDates) {
            const date = new Date(dateStr);
            const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
            
            if (diffDays === consecutive) {
                consecutive++;
                currentDate = date;
            } else {
                break;
            }
        }
        
        return consecutive;
    }

    showModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    saveData() {
        try {
            localStorage.setItem('diaryEntries', JSON.stringify(this.entries));
            localStorage.setItem('diaryDiaries', JSON.stringify(this.diaries));
            console.log('數據已保存', {
                entries: this.entries.length,
                diaries: this.diaries.length
            });
            this.showNotification('數據已保存', 'success');
        } catch (error) {
            console.error('保存數據失敗:', error);
            this.showNotification('保存失敗，請檢查瀏覽器設置', 'error');
        }
    }

    loadData() {
        try {
            const savedEntries = localStorage.getItem('diaryEntries');
            const savedDiaries = localStorage.getItem('diaryDiaries');
            
            if (savedEntries) {
                this.entries = JSON.parse(savedEntries);
                console.log('已加載記錄', this.entries.length, '條');
            }
            
            if (savedDiaries) {
                this.diaries = JSON.parse(savedDiaries);
                console.log('已加載日記', this.diaries.length, '篇');
            }
            
            console.log('數據加載完成');
        } catch (error) {
            console.error('加載數據失敗:', error);
            this.showNotification('加載數據失敗，將使用空白狀態', 'error');
            this.entries = [];
            this.diaries = [];
        }
    }
}

// 初始化應用
let diaryManager;
document.addEventListener('DOMContentLoaded', () => {
    diaryManager = new DiaryManager();
});