// Profit Distribution Pie Chart using ECharts
let profitChart = null;

function initializeProfitChart(labels = [], data = []) {
    const chartDom = document.getElementById('profitDoughnutChart');
    if (!chartDom) {
        console.error('Canvas element #profitDoughnutChart not found');
        return false;
    }

    if (typeof echarts === 'undefined') {
        console.error('ECharts library not loaded');
        return false;
    }

    // Responsive sizing based on screen width
    const isMobile = window.innerWidth < 768;
    const isSmallMobile = window.innerWidth < 576;
    
    console.log('Initializing chart with labels:', labels, 'data:', data);
    console.log('Screen width:', window.innerWidth, 'isMobile:', isMobile);

    // Custom color palette
    const colors = [
        '#0066FF',  // Primary Blue
        '#31C950',  // Success Green
        '#FA8FBB',  // Secondary Pink
        '#F54927',  // Danger Red
        '#FAA18F',  // Warning Orange
        '#9C0745',  // Dark Magenta
        '#FF0033',  // Bright Red
        '#FEEBE7',  // Light Pink
        '#0066FF',  // Primary Blue (repeat)
        '#31C950',  // Success Green (repeat)
        '#FA8FBB',  // Secondary Pink (repeat)
        '#F54927'   // Danger Red (repeat)
    ];

    if (profitChart) {
        profitChart.dispose();
    }

    profitChart = echarts.init(chartDom, null, { renderer: 'canvas' });

    const chartData = labels.map((label, index) => ({
        value: data[index],
        name: label
    }));

    const option = {
        color: colors.slice(0, labels.length),
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            textStyle: {
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif'
            },
            padding: [12, 16],
            borderRadius: 10,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            formatter: function(params) {
                if (params.componentSubType === 'pie') {
                    const total = chartData.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
                    return `<div style="min-width: 200px;"><strong style="font-size: 14px;">${params.name}</strong><br/><span style="color: #94a3b8; font-size: 12px; margin-top: 4px; display: block;">UGX ${params.value.toLocaleString()}</span><span style="color: ${params.color}; font-weight: 700; font-size: 13px; margin-top: 4px; display: block;">${percentage}% of total</span></div>`;
                }
                return params.name;
            }
        },
        legend: {
            bottom: isSmallMobile ? '2%' : isMobile ? '3%' : '5%',
            left: 'center',
            textStyle: {
                color: '#64748b',
                fontSize: isSmallMobile ? 11 : isMobile ? 12 : 13,
                fontWeight: 500,
                fontFamily: 'system-ui, -apple-system, sans-serif'
            },
            itemGap: isSmallMobile ? 12 : isMobile ? 16 : 20,
            icon: 'circle',
            data: chartData.map(item => item.name)
        },
        animationDuration: 1200,
        animationEasing: 'cubicOut',
        series: [
            {
                name: 'Profit Distribution',
                type: 'pie',
                radius: isSmallMobile ? ['30%', '70%'] : isMobile ? ['32%', '68%'] : ['35%', '65%'],
                center: isSmallMobile ? ['50%', '43%'] : isMobile ? ['50%', '44%'] : ['50%', '45%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: [8, 8],
                    borderColor: '#ffffff',
                    borderWidth: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
                    opacity: 0.95
                },
                data: chartData,
                emphasis: {
                    scale: 1.05,
                    itemStyle: {
                        borderWidth: isSmallMobile ? 2 : isMobile ? 2.5 : 3,
                        borderColor: '#ffffff',
                        shadowBlur: 30,
                        shadowOffsetX: 0,
                        shadowOffsetY: 8,
                        shadowColor: 'rgba(0, 0, 0, 0.25)',
                        opacity: 1
                    }
                },
                label: {
                    position: 'inside',
                    fontSize: isSmallMobile ? 10 : isMobile ? 11 : 12,
                    color: '#ffffff',
                    fontWeight: 600,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    formatter: function(params) {
                        return params.percent > (isSmallMobile ? 8 : 6) ? params.percent.toFixed(0) + '%' : '';
                    }
                },
                labelLine: {
                    show: false
                }
            }
        ]
    };

    profitChart.setOption(option);
    
    // Handle responsive resizing
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (profitChart) {
                profitChart.resize();
                // Re-initialize chart on major orientation changes
                if ((window.innerWidth < 768 && chartDom.offsetWidth > 400) ||
                    (window.innerWidth >= 768 && chartDom.offsetWidth <= 400)) {
                    updateProfitChart();
                }
            }
        }, 300);
    });

    console.log('Chart created successfully');
    return true;
}

async function updateProfitChart() {
    try {
        console.log('updateProfitChart called');
        
        if (typeof Storage === 'undefined') {
            console.warn('Storage not available yet');
            return;
        }

        const allMembers = await Storage.getMembers() || [];
        const allLoans = await Storage.getLoans() || [];

        console.log('Retrieved members:', allMembers.length, 'loans:', allLoans.length);

        if (allLoans.length === 0) {
            console.log('No loans found');
            const profitDiv = document.getElementById('profitDistribution');
            if (profitDiv) {
                profitDiv.innerHTML = '<p class="text-muted text-center py-3">No loans data available</p>';
                profitDiv.style.display = 'block';
            }
            if (profitChart) {
                profitChart.clear();
            }
            return;
        }

        // Calculate member profit contributions
        const memberProfits = {};
        allMembers.forEach(member => {
            memberProfits[member.id] = 0;
        });

        allLoans.forEach(loan => {
            const interestAmount = (loan.amount * (loan.interestRate || 2) / 100) * (loan.term / 12);
            if (memberProfits.hasOwnProperty(loan.memberId)) {
                memberProfits[loan.memberId] += interestAmount;
            }
        });

        // Filter members with profit
        const memberData = [];
        allMembers.forEach(member => {
            if (memberProfits[member.id] > 0) {
                memberData.push({
                    name: member.name,
                    profit: Math.round(memberProfits[member.id])
                });
            }
        });

        // Sort by profit
        memberData.sort((a, b) => b.profit - a.profit);

        const memberLabels = memberData.map(item => item.name);
        const memberValues = memberData.map(item => item.profit);

        console.log('Prepared chart data:', memberLabels, memberValues);

        if (memberLabels.length === 0) {
            console.log('No members with profit');
            const profitDiv = document.getElementById('profitDistribution');
            if (profitDiv) {
                profitDiv.innerHTML = '<p class="text-muted text-center py-3">No profit data available</p>';
                profitDiv.style.display = 'block';
            }
            return;
        }

        // Hide message and show chart
        const profitDiv = document.getElementById('profitDistribution');
        if (profitDiv) {
            profitDiv.style.display = 'none';
        }

        if (!profitChart) {
            initializeProfitChart(memberLabels, memberValues);
        } else {
            const chartData = memberLabels.map((label, index) => ({
                value: memberValues[index],
                name: label
            }));
            profitChart.setOption({
                series: [{
                    data: chartData
                }]
            });
        }

        console.log('Chart updated successfully');
    } catch (error) {
        console.error('Error in updateProfitChart:', error);
        const profitDiv = document.getElementById('profitDistribution');
        if (profitDiv) {
            profitDiv.innerHTML = '<p class="text-danger text-center py-3">Error: ' + error.message + '</p>';
        }
    }
}

// Initialize
async function initWhenReady() {
    console.log('Checking dependencies...');
    console.log('- ECharts:', typeof echarts !== 'undefined');
    console.log('- Storage object:', typeof Storage !== 'undefined');
    console.log('- IndexedDBManager:', typeof IndexedDBManager !== 'undefined');
    console.log('- IndexedDBManager.db:', IndexedDBManager?.db ? 'initialized' : 'not initialized');
    console.log('- Container:', document.getElementById('profitDoughnutChart') !== null);

    if (typeof echarts === 'undefined' || !window.Storage || !document.getElementById('profitDoughnutChart')) {
        console.log('Dependencies not ready, retrying in 500ms...');
        setTimeout(initWhenReady, 500);
        return;
    }

    // Initialize IndexedDB if not already done
    if (!IndexedDBManager.db) {
        try {
            console.log('Initializing IndexedDB...');
            await IndexedDBManager.init();
            await Storage.init();
            console.log('IndexedDB and Storage initialized');
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            setTimeout(initWhenReady, 500);
            return;
        }
    }

    console.log('All dependencies loaded. Starting update...');
    updateProfitChart();
}

// Start initialization after full page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired, waiting 2s for dependencies...');
        setTimeout(initWhenReady, 2000);
    });
} else {
    console.log('Document already loaded, initializing...');
    setTimeout(initWhenReady, 2000);
}

// Update on data changes
window.addEventListener('dataUpdated', () => {
    console.log('dataUpdated event fired');
    updateProfitChart();
});
