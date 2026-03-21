window.addEventListener('DOMContentLoaded', () => {

    $(function () {
        // Smooth Scroll
        $('a[href^="#"]').click(function () {
            var speed = 600;
            var href = $(this).attr("href");
            var target = $(href == "#" || href == "" ? 'html' : href);
            var position = target.offset().top - 80;
            $("html, body").animate({ scrollTop: position }, speed, "swing");
            return false;
        });
    });

    // --- microCMS 設定 ---
    const API_KEY = "7EtHGHzWxzwQ6y2MPz3y3fFRrsTWF3jnXbSw";
    const SERVICE_DOMAIN = "alii";

    /**
     * メニューをmicroCMSから取得して描画する関数
     * @param {string} filter - 'all', 'facial', 'body', 'other'
     */
    async function renderMenu(filter) {
        const grid = document.getElementById('dynamic-menu-grid');
        if (!grid) return;

        try {
            const res = await fetch(`https://${SERVICE_DOMAIN}.microcms.io/api/v1/menus?limit=100`, {
                headers: { "X-MICROCMS-API-KEY": API_KEY }
            });
            const data = await res.json();
            const salonMenus = data.contents;

            grid.innerHTML = '';

            // --- フィルタリングの修正 ---
            const filtered = filter === 'all'
                ? salonMenus
                : salonMenus.filter(m => {
                    // m.cat がオブジェクト形式（{value: "body"}など）の場合を考慮
                    const categoryValue = (typeof m.cat === 'object' && m.cat !== null) ? m.cat[0] || m.cat.value : m.cat;
                    return categoryValue === filter;
                });

            filtered.forEach(m => {
                let priceHtml = '';
                if (m.options && m.options.length > 0) {
                    priceHtml = m.options.map(opt =>
                        `<div style="margin-bottom: 4px;">¥${opt.price.toLocaleString()} / ${opt.time}</div>`
                    ).join('');
                } else {
                    priceHtml = `<div>¥${(m.price || 0).toLocaleString()} / ${m.time || ''}</div>`;
                }

                const card = `
                <div class="menu-card active">
                    <span class="menu-cat-badge">${m.catLabel || ''}</span>
                    <h4 class="menu-name" style="font-size: 1.1rem; font-weight: 500; margin-bottom: 10px;">${m.name}</h4>
                    <p style="font-size: 0.85rem; margin-bottom: 20px; color: #666;">${m.desc}</p>
                    <div class="menu-price-val" style="line-height: 1.4;">
                        ${priceHtml}
                    </div>
                </div>
            `;
                grid.insertAdjacentHTML('beforeend', card);
            });
        } catch (err) {
            console.error("メニューデータの取得に失敗しました", err);
        }
    }

    $(function () {
        // --- 初期表示 ---
        renderMenu('all');

        // --- フィルタクリックイベント ---
        $('.filter-btn').on('click', function () {
            $('.filter-btn').removeClass('active');
            $(this).addClass('active');
            const filter = $(this).data('filter');
            renderMenu(filter);
        });

        // --- スクロールアニメーション ---
        $(window).on('scroll load', function () {
            $('.reveal').each(function () {
                var pos = $(this).offset().top;
                var scroll = $(window).scrollTop();
                var windowHeight = $(window).height();
                if (scroll > pos - windowHeight + 150) {
                    $(this).addClass('active');
                }
            });
        });
    });

    // --- お知らせ(News) / ブログ(Blog) 連携 ---
    $(function () {
        function fetchMicroCMS(endpoint, targetClass) {
            fetch(`https://${SERVICE_DOMAIN}.microcms.io/api/v1/${endpoint}`, {
                headers: { "X-MICROCMS-API-KEY": API_KEY }
            })
                .then(res => res.json())
                .then(data => {
                    const $list = $(targetClass);
                    $list.empty();

                    data.contents.forEach(item => {
                        const rawDate = new Date(item.date || item.createdAt);
                        const formattedDate = rawDate.getFullYear() + '.' +
                            ('0' + (rawDate.getMonth() + 1)).slice(-2) + '.' +
                            ('0' + rawDate.getDate()).slice(-2);

                        const titleHtml = item.url
                            ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="news-title" title="${item.title}">${item.title}</a>`
                            : `<span class="news-title" title="${item.title}">${item.title}</span>`;

                        const html = `<li class="news-item-mini"><span class="news-date">${formattedDate}</span>${titleHtml}</li>`;
                        $list.append(html);
                    });
                })
                .catch(err => console.error(`${endpoint}の取得に失敗しました`, err));
        }

        fetchMicroCMS("news", ".news-list-mini:first");
        fetchMicroCMS("blog", ".news-list-mini:last");
    });
});