// Production copy: official sources + Human iOS 26.7 evidence in docs/M5_PWA.md.
// Browser choice is presentation only; never an install/standalone authority.
const addHome = { icon: 'add-home', title: '「ホーム画面に追加」→「追加」', note: '「Web アプリとして開く」が表示される場合は、オンにしてから追加します。' };
const launchHome = { icon: 'launch', title: 'ホーム画面の「Black Auction」を開く' };

export const INSTALL_GUIDES = {
  iphone: { label: 'iPhone · Safari', steps: [
    { icon: 'share', title: 'Safariの共有ボタンをタップ', note: '四角から上向きの矢印が出たボタンです。' },
    { icon: 'expand', title: '「表示を増やす」をタップ', note: '「ホーム画面に追加」がすでに見える場合は、次へ進みます。' },
    addHome, launchHome,
  ], note: '共有ボタンが見当たらないときは「…」をタップし、「共有」を選びます。',
  missingAction: '共有画面の「表示を増やす」を確認してください。それでも見つからない場合は、一覧の下にある「アクションを編集」を確認してください。' },
  ipad: { label: 'iPad · Safari', steps: [
    { icon: 'share', title: 'Safariの共有ボタンをタップ', note: 'このページをSafariで開いて操作します。' },
    { icon: 'expand', title: '共有画面でその他の項目を表示' },
    addHome, launchHome,
  ], note: 'メニューの表示はSafariのバージョンやレイアウトによって異なります。',
  missingAction: '共有画面でその他の項目を表示し、「ホーム画面に追加」を探してください。' },
  iosChrome: { label: 'iPhone / iPad · Chrome', steps: [
    { icon: 'share', title: 'Chromeの共有ボタンをタップ', note: 'アドレスバーの横にある、四角から上向きの矢印が出たボタンです。' },
    { icon: 'expand', title: '共有画面を下へスクロール', note: '「表示を増やす」が表示される場合はタップします。' },
    addHome, launchHome,
  ], note: 'Chromeでこのページを開いて操作します。共有画面の表示はOSのバージョンによって異なります。',
  missingAction: '共有画面の「表示を増やす」があれば開いてください。それでも見つからない場合は、「アクションを編集」があれば確認するか、Safariの案内をご確認ください。' },
  android: { label: 'Android · Chrome', steps: [
    { icon: 'menu', title: 'Chromeでこのページを開き、メニューを開きます。' },
    { icon: 'add-home', title: '「インストールしてショートカットを作成」から「インストール」を選び、画面の案内に従います。' },
    { icon: 'launch', title: '追加された「Black Auction」から起動します。' },
  ], note: '表示名やインストールの可否はブラウザによって異なります。項目がない場合は、対応するブラウザでオンラインの状態で開いてください。',
  missingAction: 'AndroidではChromeの「インストールしてショートカットを作成」を確認してください。' },
  desktop: { label: 'PC · Chrome / Edge', steps: [
    { icon: 'menu', title: 'Chromeではメニューの「キャスト、保存、共有」から「ページをアプリとしてインストール」を選びます。' },
    { icon: 'menu', title: 'Edgeではメニューの「その他のツール」→「アプリ」から、このサイトをアプリとしてインストールします。' },
    { icon: 'launch', title: '画面の案内に従い、追加された「Black Auction」から起動します。' },
  ], note: '表示されている場合は、アドレスバーのインストールボタンも使えます。インストールに対応するブラウザをオンラインで利用してください。',
  missingAction: 'PCではChrome / Edgeのアプリとしてインストールする項目をご確認ください。' },
};

export function offlinePresentation(snapshot = {}) {
  if (snapshot.status === 'ready' && snapshot.ready === true && snapshot.complete === true) {
    return { tone: 'positive', title: 'オフライン準備完了', detail: 'この画面のゲームデータを保存しました。追加後は、通信できる状態でホーム画面のアイコンから一度起動してください。' };
  }
  if (['degraded', 'registration-failed', 'failed'].includes(snapshot.status)) {
    return { tone: 'error', title: 'オフライン準備を完了できませんでした', detail: '通信を確認し、オンラインの状態で開き直してください。' };
  }
  if (['unsupported', 'insecure-context', 'out-of-scope'].includes(snapshot.status)) {
    return { tone: 'neutral', title: 'この環境ではオフラインの準備ができません', detail: '対応するブラウザで、保護された接続のページを開いてください。' };
  }
  return { tone: 'neutral', title: 'ゲームデータを準備中', detail: '通信できる状態で、準備が終わるまでお待ちください。' };
}
