時間つたえるくん（PWA）

Androidスマホだけで公開・インストールする方法（GitHub Pages）
1. GitHubでアカウントを作り、Publicリポジトリを新規作成します。
2. このZIPを解凍し、index.html / manifest.webmanifest / sw.js / icon-192.png / icon-512.png の5ファイルをリポジトリの最上位にアップロードします。スマホのブラウザでGitHubを開き、「Add file」→「Upload files」を使います。メニューが見つからない場合はChromeの「PC版サイト」を有効にしてください。
3. リポジトリの Settings → Pages → Build and deployment で Deploy from a branch、Branch を main、フォルダを /(root) にして保存します。
4. 数分後、Pages画面に表示される https://ユーザー名.github.io/リポジトリ名/ のURLをChromeで開きます。
5. Chromeの「︙」→「ホーム画面に追加」または「アプリをインストール」を選びます。

注意：GitHub Pagesに公開したコードは一般公開されますが、入力した予定はブラウザのlocalStorageに保存され、GitHubにアップロードされません。共有端末では使用しないでください。
通知はアプリを開いている間の補助です。PWAを閉じた状態の確実な通知やLINE自動送信には対応しません。スマホの標準アラームと併用してください。
ローカルファイルを直接開いても、PWAインストールやService Workerは使えません。HTTPSの公開が必要です。
