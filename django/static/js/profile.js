

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

// function submitEditForm() {
//     const form = document.getElementById('editProfileForm');
//     if (!form) {
//         console.error("Form element not found");
//         return;
//     }

//     const formData = new FormData(form);
// 	formData.append('submit', 'edit');
//     const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;

//     fetch(form.action, {
//         method: 'POST',
//         headers: {
//             'X-CSRFToken': csrfToken
//         },
//         body: formData
//     })
//     .then(response => response.json())
//     .then(data => {
//         if (data.success) {
//             doneEdit();
// 			swapApp(window.location.pathname);
//         } else {
//             console.error('Error:', data.errors);
//         }
//     })
//     .catch((error) => {
//         console.error('Error:', error);
//     });
// }

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
    const wins = parseInt(myChart.getAttribute('data-wins'));
    const losses = parseInt(myChart.getAttribute('data-losses'));
    if (losses == 0 && wins == 0) { nothing = 1;} else {nothing = 0}
    const chartData = {
        labels: ["Wins", "Losses"],
        data: [wins, losses],
        cdata: [wins, losses, nothing],
    };

    const textAround = {
        id: 'textAround',
        beforeDatasetsDraw(chart, args, plugins) {
            const { ctx, data} = chart;
            const sum = data.datasets[0].data.reduce((accumulator, currentValue) => accumulator + currentValue, 0)

            const xCenter = chart.getDatasetMeta(0).data[0].x;
            const yCenter = chart.getDatasetMeta(0).data[0].y;
            const win = data.datasets[0].data[0];
            const lose = data.datasets[0].data[1];
            const percentage = ((data.datasets[0].data[0] / sum) * 100).toFixed(0);

            ctx.save()
            // ctx.font = "400 16px Poppins";
            ctx.font = "400 16px";
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`Win rate`, xCenter, yCenter - 40);
            ctx.save()
            ctx.font = "400 40px";
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`${percentage}%`, xCenter, yCenter + 5);
            ctx.save()
            ctx.font = "400 14px";
            ctx.fillStyle = '#c0c0c0';
            ctx.textAlign = 'center';
            ctx.fillText(`Wins    ${win}`, xCenter, yCenter + 38);
            ctx.fillText(`Losses  ${lose}`, xCenter, yCenter + 58);
        }
    }

    new Chart(document.querySelector(".my-chart"), {
        type: "doughnut",
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: "Game Stat",
                    data: chartData.cdata,
                    backgroundColor: ['#3ea7ed', '#ef5d7f', '#ffffff'],
                    cutout: '75%'
                },
            ],
        },
        options: {
            borderWidth: 2,
            borderRadius: 2,
            hoverBorderWidth: 0,
            layout : {
                padding: 20
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
        plugins: [textAround],
    });
} else {
    console.error("Chart element not found");
}
