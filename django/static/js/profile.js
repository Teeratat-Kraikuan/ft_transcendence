

// function showEdit() {
// 	document.getElementById("popUpEdit").style.display = 'block';
// }
// function doneEdit() {
// 	document.getElementById("popUpEdit").style.display = 'none';
// }
// function showFriendManage() {
// 	document.getElementById("popUpFriend").style.display = 'block';
// }
// function doneFriendManage() {
// 	document.getElementById("popUpFriend").style.display = 'none';
// }

// function unblock(username) {
// 	console.log("unblocking "+username);
// 	document.getElementById('block_button').style.visibility = 'hidden';
// 	fetch('/users/unblock/' + username + '/', {
//         method: 'GET',
//     })
//     .then(async response => {
// 		if (!response.ok) {
//             const text = await response.text();
// 			throw new Error('Network response was not ok: ' + text);
//         }
// 		return response.json();
// 	})
//     .then(data => {
//         if (data.status === 'success') {
//             console.log('User unblocked successfully');
//         } else {
//             console.log('Failed to unblock user');
//             document.getElementById('block_button').style.visibility = 'visible';
//         }
//     })
//     .catch(error => {
//         console.error('Error:', error);
//         document.getElementById('block_button').style.visibility = 'visible';
//     });
// }

// function submitEditForm(username, type) {
//     const editApiEndpoint = '/api/v1/edit_user_profile/';
//     const form = document.getElementById('editProfileForm');
//     if (!form || !username) {
//         console.error("Form element not found");
//         return;
//     }
//     const formData = new FormData(form);
// 	formData.append('submit', type);
//     formData.append('username', username);
    // const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // fetch(editApiEndpoint, {
    //     method: 'POST',
    //     credentials: 'include',
    //     headers: {
    //         'X-CSRFToken': csrfToken
    //     },
    //     body: formData
    // })
//     .then(response => response.json())
//     .then(data => {
//         if (data.success) {
//             doneEdit();
// 			window.location.reload();
//         } else {
//             console.error('Error:', data.errors);
//         }
//     })
//     .catch((error) => {
//         console.error('Error:', error);
//     });
// }

(function () {
    "use strict";

    function profile_main ()
    {
        const redirect = (url) => {
            if (!url || typeof url !== 'string') {
                console.error('Invalid URL:', url);
                return;
            }
            let tmp_url = url;
            if (url[0] === '/')
                tmp_url = `${location.protocol}//${location.host}${url}`;
            
            const fullUrl = new URL(tmp_url, `${location.protocol}//${location.host}`);
        
            // if (fullUrl.pathname === location.pathname)
            //     return;
            
            console.log(`Routing to ${url} ...`);
        
            if (fullUrl.hostname !== location.hostname) {
                if (!confirm(`Potential risk up ahead! Are you sure you want to follow this link?\nURL: ${url}`))
                    return console.log("Routing cancelled.");
                location.href = url;
                return;
            }
        
            window.history.pushState({}, "", url);
            handle_location();
        };
    
        const router = (ev) => {
            const target = ev.target || ev.srcElement || ev;
            const url = target.hasAttribute("noaction") ? null : target.href || target.action;
    
            ev.preventDefault();
            // Ignore empty url
            if (!url) return;
            // Redirection (links, etc.)
            else if (target.href) redirect(url);
            // Forms (login, signup, 2FA)
            else if (target.action)
            {
                const csrftoken = /csrftoken=(.[^;]*)/ig.exec(document.cookie);
                if (!target.checkValidity())
                    return target.reportValidity();
                console.log(`Submitting to ${url}...`);
                var xhttp = new XMLHttpRequest();
                xhttp.open(target.method || "POST", url, true);
                if (csrftoken)
                    xhttp.setRequestHeader("X-CSRFToken", csrftoken[1]);
                xhttp.setRequestHeader("Accept", "application/json");
                xhttp.onreadystatechange = target.onreadystatechange;
                xhttp.onload = (ev) => {
                    if (target.onload)
                        target.onload(xhttp);
                    if (xhttp.status == 200 && target.getAttribute('redirect'))
                        redirect(target.getAttribute('redirect'));
                    else if (xhttp.status != 200 && target.getAttribute('redirect')){
                        var response = JSON.parse(xhttp.responseText);
                        alert(response.message);
                    }
                };
                xhttp.send(new FormData(target));
                if (target.onaftersubmit)
                    target.onaftersubmit(target);
                target.onaftersubmit = null;
            }
        };
    
        const init_event_handler = () => {
            // Why use addEventListener? It's there to prevent override of event click listener,
            // because it can't be erased without a reference to the event listener object.
            document.querySelectorAll("a:not([no-route])")
                    .forEach( el => el.addEventListener('click', router) );
            document.querySelectorAll("form")
                    .forEach( el => el.addEventListener('submit', router) );
            // For redirecting a custom element
            document.querySelectorAll("*[class='redirect_spa']")
                    .forEach( el => el.addEventListener('click', router) );
            document.querySelectorAll("*[data-bs-toggle]").forEach(el => {
                const menus = document.querySelectorAll(el.getAttribute("data-bs-target"));
                el.addEventListener("click", ev => {
                    menus.forEach(menu => {
                        menu.tabIndex = 0;
                        menu.focus();
                    });
                });
                menus.forEach(menu => menu.addEventListener("focusout", ev => {
                    let within = menu.matches(':focus-within');
                    if (within)
                        return ;
                    document.querySelectorAll(".collapse.show").forEach(
                        el => {
                            menu.removeAttribute("tabindex");
                            bootstrap.Collapse.getInstance(el).hide();
                        }
                    );
                }));
            });
        };
    
        const handle_location = async () => {
            const data = await fetch(window.location.pathname);
            const html = document.createElement("html");
            // Unload game scripts, etc.
            if (typeof window.unload == "function")
            {
                window.unload();
                window.unload = null;
            }
            html.innerHTML = await data.text();
            document.body = html.getElementsByTagName("body")[0];
            // "Unload scripts"
            document.head.querySelectorAll("script[src]").forEach(el => {
                el.remove();
            });
            // Set head to the new one.
            document.head.innerHTML = html.getElementsByTagName("head")[0].innerHTML;
            // Load scripts
            html.querySelectorAll("script[src]").forEach(el => {
                if (el.getAttribute("load-once"))
                    return ;
                let script = document.createElement('script');
                script.src = el.src;
                if (el.type)
                    script.type = el.type;
                if (el.defer)
                    script.setAttribute("defer", el.defer ? "true" : "false");
                document.head.append(script);
            });
            init_event_handler();
            if (typeof window.redirected == "function")
                window.redirected = window.redirected();
        };
        const editBtn = document.getElementById('editProfileBtn');
        const closeEditBtn = document.getElementById('closeProfileEditBtn');
        const form = document.getElementById('editProfileForm');
        const username = form.getAttribute("uname");
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        editBtn.onclick = function () {
            document.getElementById("popUpEdit").style.display = 'block';
            closeEditBtn.focus();
        }
        closeEditBtn.onclick = function () {
            document.getElementById("popUpEdit").style.display = 'none';
        }
        form.onsubmit = async function () {
            const editApiEndpoint = '/api/v1/edit_user_profile/';
            const formData = new FormData(form);
            formData.append('submit', 'edit');
            formData.append('username', username);

            const res = await fetch(editApiEndpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            });
            window.redirected = profile_main;
            redirect(location.pathname);
        }
    }

    function loadChartJS(callback) {
        if (typeof Chart !== "undefined") {
            callback();
            return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = callback;
        script.onerror = () => console.error("Failed to load Chart.js");
        document.head.appendChild(script);
    }
    function initialize() {
        if (document.querySelector(".progress")) {
            const progress = document.querySelector(".progress")
            const score = parseInt(progress.getAttribute('data-score'));
            const conceded = parseInt(progress.getAttribute('data-conceded'));
            const all = score + conceded
            const p_score = (score == 0 && conceded == 0) ? 0 : (Math.round((score / all) * 100)).toString();
            const p_conceded = (score == 0 && conceded == 0) ? 0 :  (Math.round((conceded / all) * 100)).toString();
            document.getElementById('score_bar').style.width = p_score+'%'
            document.getElementById('conceded_bar').style.width = p_conceded+'%'
        } else { console.log("Progress element not found")}
        if (document.querySelector(".my-chart")) {
            const myChart = document.querySelector(".my-chart");
            const wins = parseInt(myChart.getAttribute('data-wins')) || 0;
            const losses = parseInt(myChart.getAttribute('data-losses')) || 0;
            const nothing = (wins === 0 && losses === 0) ? 1 : 0;
            const chartData = {
                labels: ["Wins", "Losses"],
                data: [wins, losses],
                cdata: [wins, losses, nothing],
            };
            const textAround = {
                id: 'textAround',
                beforeDatasetsDraw(chart, args, plugins) {
                    const { ctx, data } = chart;
                    const sum = data.datasets[0].data.reduce((a, c) => a + c, 0);
                    const xCenter = chart.getDatasetMeta(0).data[0].x;
                    const yCenter = chart.getDatasetMeta(0).data[0].y;
                    const win = data.datasets[0].data[0];
                    const lose = data.datasets[0].data[1];
                    const percentage = sum ? ((win / sum) * 100).toFixed(0) : "0";
                    ctx.font = '400 1em sans-serif';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.fillText(`Win rate`, xCenter, yCenter - 40);
                    ctx.font = '400 2.2em sans-serif';
                    ctx.fillText(`${percentage}%`, xCenter, yCenter);
                    ctx.font = '400 0.8em sans-serif';
                    ctx.fillStyle = '#c0c0c0';
                    ctx.fillText(`Wins    ${win}`, xCenter, yCenter + 38);
                    ctx.fillText(`Losses  ${lose}`, xCenter, yCenter + 58);
                    ctx.save();
                }
            };

            new Chart(myChart, {
                type: "doughnut",
                data: {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: "Game Stat",
                            data: chartData.cdata,
                            backgroundColor: ['#3ea7ed', '#ef5d7f', '#ffffff'],
                            cutout: '75%',
                        },
                    ],
                },
                options: {
                    borderWidth: 2,
                    borderRadius: 2,
                    hoverBorderWidth: 0,
                    layout: { padding: 20 },
                    plugins: {
                        legend: { display: false },
                    },
                },
                plugins: [textAround],
            });
        } else {
            console.error("Chart element not found");
        }
    }

    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            loadChartJS(initialize);
        });
    } else {
        profile_main();
        loadChartJS(initialize);
    }

    // if (window["initialize"] != undefined) {
    //     window["initialize"]();
    // }

})();
