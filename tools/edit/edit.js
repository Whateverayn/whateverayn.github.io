function editCalcTime() {
    // 日付と時刻の取得
    const dateInput = document.getElementById('createDate').value;
    const timeInput = document.getElementById('createTime').value;

    // 日付と時刻が正しい場合のみ処理を実行
    if (editIsValidDate(dateInput) && editIsValidTime(timeInput)) {
        // 日付と時刻を結合して新しいDateオブジェクトを作成
        const combinedDateTime = new Date(dateInput + 'T' + timeInput);
        // 結果を表示する<input>要素を取得して設定
        document.getElementById('calcTime').value = combinedDateTime.toISOString();
    } else {
        // 不正確な日付や時刻の場合
        document.getElementById('calcTime').value = 'Invalid value';
    }
}

// 日付が正しいかどうかを確認する関数
function editIsValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
}

// 時刻が正しいかどうかを確認する関数
function editIsValidTime(timeString) {
    const regex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeString);
}