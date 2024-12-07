

function showEdit() {
	document.getElementById("popUpEdit").style.display = 'block';
}
function doneEdit() {
	document.getElementById("popUpEdit").style.display = 'none';
}
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

function submitEditForm(username) {
    console.log("Hello from Edit");
    console.log("Try to edit : " + username);
    const editApiEndpoint = '/api/v1/edit_user_profile/';
    const form = document.getElementById('editProfileForm');
    if (!form || !username) {
        console.error("Form element not found");
        return;
    }
    const formData = new FormData(form);
	formData.append('submit', 'edit');
    formData.append('username', username);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(editApiEndpoint, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            doneEdit();
			window.location.reload();
        } else {
            console.error('Error:', data.errors);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

(function () {
    "use strict";
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
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }

    if (window["initialize"] != undefined) {
        window["initialize"]();
    }

})();