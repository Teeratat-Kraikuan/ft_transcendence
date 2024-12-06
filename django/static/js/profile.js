

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

                    ctx.save();
                    ctx.font = "400 16px";
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.fillText(`Win rate`, xCenter, yCenter - 40);

                    ctx.font = "400 40px";
                    ctx.fillText(`${percentage}%`, xCenter, yCenter + 5);

                    ctx.font = "400 14px";
                    ctx.fillStyle = '#c0c0c0';
                    ctx.fillText(`Wins    ${win}`, xCenter, yCenter + 38);
                    ctx.fillText(`Losses  ${lose}`, xCenter, yCenter + 58);
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