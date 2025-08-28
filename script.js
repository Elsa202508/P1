// 化妆品管理工具 JavaScript
class CosmeticManager {
    constructor() {
        this.cosmetics = this.loadFromStorage();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderCosmetics();
        this.updateStats();
        this.setDefaultDate();
    }

    // 设置默认购买日期为今天
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseDate').value = today;
    }

    // 绑定事件
    bindEvents() {
        // 添加化妆品表单提交
        document.getElementById('cosmeticForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCosmetic();
        });

        // 编辑表单提交
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateCosmetic();
        });

        // 筛选器变化
        document.getElementById('filterCategory').addEventListener('change', () => {
            this.renderCosmetics();
        });

        document.getElementById('filterStatus').addEventListener('change', () => {
            this.renderCosmetics();
        });

        // 模态框点击外部关闭
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });
    }

    // 添加化妆品
    addCosmetic() {
        const form = document.getElementById('cosmeticForm');
        const formData = new FormData(form);
        
        const cosmetic = {
            id: Date.now().toString(),
            name: formData.get('name').trim(),
            purchaseDate: formData.get('purchaseDate'),
            shelfLife: parseInt(formData.get('shelfLife')),
            category: formData.get('category'),
            createdAt: new Date().toISOString()
        };

        // 验证数据
        if (!cosmetic.name || !cosmetic.purchaseDate || !cosmetic.shelfLife) {
            this.showNotification('请填写完整信息', 'error');
            return;
        }

        this.cosmetics.push(cosmetic);
        this.saveToStorage();
        this.renderCosmetics();
        this.updateStats();
        form.reset();
        this.setDefaultDate();
        this.showNotification('化妆品添加成功！', 'success');
    }

    // 计算过期信息
    calculateExpiryInfo(cosmetic) {
        const purchaseDate = new Date(cosmetic.purchaseDate);
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(expiryDate.getMonth() + cosmetic.shelfLife);
        
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let status = 'fresh';
        let statusText = '新鲜';
        let statusClass = 'status-fresh';
        
        if (daysUntilExpiry < 0) {
            status = 'expired';
            statusText = `已过期 ${Math.abs(daysUntilExpiry)} 天`;
            statusClass = 'status-expired';
        } else if (daysUntilExpiry <= 30) {
            status = 'warning';
            statusText = `${daysUntilExpiry} 天后过期`;
            statusClass = 'status-warning';
        } else {
            statusText = `${daysUntilExpiry} 天后过期`;
        }
        
        return {
            expiryDate: expiryDate.toLocaleDateString('zh-CN'),
            daysUntilExpiry,
            status,
            statusText,
            statusClass
        };
    }

    // 渲染化妆品列表
    renderCosmetics() {
        const container = document.getElementById('cosmeticList');
        const emptyState = document.getElementById('emptyState');
        const categoryFilter = document.getElementById('filterCategory').value;
        const statusFilter = document.getElementById('filterStatus').value;
        
        // 筛选化妆品
        let filteredCosmetics = this.cosmetics;
        
        if (categoryFilter !== 'all') {
            filteredCosmetics = filteredCosmetics.filter(c => c.category === categoryFilter);
        }
        
        if (statusFilter !== 'all') {
            filteredCosmetics = filteredCosmetics.filter(c => {
                const expiryInfo = this.calculateExpiryInfo(c);
                return expiryInfo.status === statusFilter;
            });
        }
        
        if (filteredCosmetics.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // 按过期时间排序
        filteredCosmetics.sort((a, b) => {
            const aExpiry = this.calculateExpiryInfo(a);
            const bExpiry = this.calculateExpiryInfo(b);
            return aExpiry.daysUntilExpiry - bExpiry.daysUntilExpiry;
        });
        
        container.innerHTML = filteredCosmetics.map(cosmetic => {
            const expiryInfo = this.calculateExpiryInfo(cosmetic);
            return this.createCosmeticCard(cosmetic, expiryInfo);
        }).join('');
    }

    // 创建化妆品卡片
    createCosmeticCard(cosmetic, expiryInfo) {
        const cardClass = expiryInfo.status === 'expired' ? 'cosmetic-card expired' : 
                         expiryInfo.status === 'warning' ? 'cosmetic-card warning' : 'cosmetic-card';
        
        return `
            <div class="${cardClass}">
                <div class="card-header">
                    <div>
                        <div class="card-title">${this.escapeHtml(cosmetic.name)}</div>
                        <div class="card-category">${cosmetic.category}</div>
                    </div>
                </div>
                
                <div class="card-info">
                    <div class="info-row">
                        <span class="info-label">购买日期:</span>
                        <span class="info-value">${new Date(cosmetic.purchaseDate).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">保质期:</span>
                        <span class="info-value">${cosmetic.shelfLife} 个月</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">过期日期:</span>
                        <span class="info-value">${expiryInfo.expiryDate}</span>
                    </div>
                </div>
                
                <div class="expiry-status ${expiryInfo.statusClass}">
                    ${expiryInfo.statusText}
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-secondary btn-small" onclick="cosmeticManager.editCosmetic('${cosmetic.id}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn btn-danger btn-small" onclick="cosmeticManager.deleteCosmetic('${cosmetic.id}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `;
    }

    // 编辑化妆品
    editCosmetic(id) {
        const cosmetic = this.cosmetics.find(c => c.id === id);
        if (!cosmetic) return;
        
        document.getElementById('editId').value = cosmetic.id;
        document.getElementById('editName').value = cosmetic.name;
        document.getElementById('editPurchaseDate').value = cosmetic.purchaseDate;
        document.getElementById('editShelfLife').value = cosmetic.shelfLife;
        document.getElementById('editCategory').value = cosmetic.category;
        
        document.getElementById('editModal').classList.add('show');
    }

    // 更新化妆品
    updateCosmetic() {
        const form = document.getElementById('editForm');
        const formData = new FormData(form);
        const id = document.getElementById('editId').value;
        
        const index = this.cosmetics.findIndex(c => c.id === id);
        if (index === -1) return;
        
        this.cosmetics[index] = {
            ...this.cosmetics[index],
            name: formData.get('name').trim(),
            purchaseDate: formData.get('purchaseDate'),
            shelfLife: parseInt(formData.get('shelfLife')),
            category: formData.get('category'),
            updatedAt: new Date().toISOString()
        };
        
        this.saveToStorage();
        this.renderCosmetics();
        this.updateStats();
        this.closeEditModal();
        this.showNotification('化妆品更新成功！', 'success');
    }

    // 删除化妆品
    deleteCosmetic(id) {
        if (!confirm('确定要删除这个化妆品吗？')) return;
        
        this.cosmetics = this.cosmetics.filter(c => c.id !== id);
        this.saveToStorage();
        this.renderCosmetics();
        this.updateStats();
        this.showNotification('化妆品删除成功！', 'success');
    }

    // 关闭编辑模态框
    closeEditModal() {
        document.getElementById('editModal').classList.remove('show');
    }

    // 更新统计信息
    updateStats() {
        const total = this.cosmetics.length;
        let warningCount = 0;
        let expiredCount = 0;
        
        this.cosmetics.forEach(cosmetic => {
            const expiryInfo = this.calculateExpiryInfo(cosmetic);
            if (expiryInfo.status === 'warning') {
                warningCount++;
            } else if (expiryInfo.status === 'expired') {
                expiredCount++;
            }
        });
        
        document.getElementById('totalCount').textContent = total;
        document.getElementById('warningCount').textContent = warningCount;
        document.getElementById('expiredCount').textContent = expiredCount;
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 从本地存储加载数据
    loadFromStorage() {
        try {
            const data = localStorage.getItem('cosmeticData');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('加载数据失败:', error);
            return [];
        }
    }

    // 保存到本地存储
    saveToStorage() {
        try {
            localStorage.setItem('cosmeticData', JSON.stringify(this.cosmetics));
        } catch (error) {
            console.error('保存数据失败:', error);
            this.showNotification('保存数据失败，请检查浏览器存储空间', 'error');
        }
    }

    // 导出数据
    exportData() {
        const dataStr = JSON.stringify(this.cosmetics, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `化妆品数据_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('数据导出成功！', 'success');
    }

    // 导入数据
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.cosmetics = importedData;
                    this.saveToStorage();
                    this.renderCosmetics();
                    this.updateStats();
                    this.showNotification('数据导入成功！', 'success');
                } else {
                    throw new Error('数据格式不正确');
                }
            } catch (error) {
                console.error('导入数据失败:', error);
                this.showNotification('导入数据失败，请检查文件格式', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// 全局函数
function closeEditModal() {
    cosmeticManager.closeEditModal();
}

// 添加通知动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 初始化应用
let cosmeticManager;
document.addEventListener('DOMContentLoaded', () => {
    cosmeticManager = new CosmeticManager();
});