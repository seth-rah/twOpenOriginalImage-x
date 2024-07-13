## Twitter to X replace fork

This is a fork of the original repository that replaces references from twitter.com to x.com 

## Original Readme

Twitter 原寸びゅー (twOpenOriginalImage)
========================================

- License: The MIT license  
- Copyright (c) 2016 風柳(furyu)  
- 対象ブラウザ： Google Chrome、Firefox、Vivaldi、Opera

[Web 版公式 Twitter](https://x.com/) ／ [TweetDeck](https://tweetdeck.x.com/) のツイートの画像を、原寸（URLが '～:orig' のもの）で開くボタンを付けるスクリプト。  
画像のダウンロード支援スクリプト（ダウンロードされる拡張子を '～.jpg-orig' 等から、'～-orig.jpg' のように変換）もあり。  


■ インストール方法 
---
### Google Chrome 拡張機能版
Google Chrome、Vivaldi、あるいは Opera＋[Download Chrome Extension](https://addons.opera.com/ja/extensions/details/download-chrome-extension-9/?display=en)の環境で、

> [Twitter 原寸びゅー](https://chrome.google.com/webstore/detail/twitter-%E5%8E%9F%E5%AF%B8%E3%81%B3%E3%82%85%E3%83%BC/bkpaljhmpehdbjkoahohlhkhlleaicel)

より拡張機能を追加する。  


### Firefox Quantum (WebExtentions)版  
Firefox Quantum で、  

> [Twitter 原寸びゅー – Firefox 向けアドオン](https://addons.mozilla.org/ja/firefox/addon/twitter-gensun-view/)

よりアドオンを追加する。  


### ユーザースクリプト版（Greasemonkey / Tampermonkey）
Firefox＋<s>[Greasemonkey](https://addons.mozilla.org/ja/firefox/addon/greasemonkey/)</s>[Tampermonkey](https://addons.mozilla.org/ja/firefox/addon/tampermonkey/)、Google Chrome＋[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=ja)、あるいは Opera＋[Tampermonkey](https://addons.opera.com/ja/extensions/details/tampermonkey-beta/?display=en)の環境で、  

> [Twitter 原寸びゅー(twOpenOriginalImage.user.js)](https://furyutei.work/userjs/furyutei/twOpenOriginalImage.user.js)  
                                
をクリックし、指示に従ってインストール。  

※ 0.1.3.0 以降は、ダウンロードヘルパー機能も原寸びゅーに集約済み。これより前に画像ダウンロードヘルパーをインストールしていた場合、当該スクリプト（twImageDownloadHelper.user）は削除しておくこと。  
※ Firefox では Quantum(57) + Greasemonkey 4 より動作しなくなった（代わりに Tampermonkey を使用すること）。  


■ 使い方
---
[Web 版公式 Twitter](https://x.com/) ／ [TweetDeck](https://tweetdeck.x.com/) 上で、画像つきツイートには [原寸画像]（[Original]）というボタンが挿入される。  
[![原寸びゅーのデモ](http://cdn-ak.f.st-hatena.com/images/fotolife/f/furyu-tei/20160319/20160319125425.png)](https://www.youtube.com/watch?v=6Z_QDlg8zDk)
これをクリックすると、オリジナルサイズの画像（URLが'～:orig'のもの）が表示される。  
[![原寸びゅーのデモ](http://cdn-ak.f.st-hatena.com/images/fotolife/f/furyu-tei/20160319/20160319125405.png)](https://www.youtube.com/watch?v=6Z_QDlg8zDk)

デフォルト設定では、ツイートの画像（サムネイル）をクリック、もしくは、個別表示時やタイムライン上にカーソルがある場合（[j][k]キーにて移動時）に[v]キー押下でも原寸画像が表示される。  

画像ダウンロードヘルパーが有効な場合は、[ダウンロード]（[Download]）ボタンが表示され、これをクリックすると当該画像がダウンロードされる（このとき、…….jpg:orig などは、……-orig.jpg に自動的に変換される）。  

拡張機能版では、オプション設定機能あり。  
また、タイムラインの画像を右クリックしてコンテキストメニューを開き、[原寸画像を保存]を選べば、当該画像がダウンロードされる（このときも拡張子は自動的に変換される）。  


■ 参考元 ( hogas ([@hogextend](https://x.com/hogextend/) ) 氏作成 )
---
- [hogashi/twitterOpenOriginalImage](https://github.com/hogashi/twitterOpenOriginalImage)  
- [GoogleChrome拡張機能「twitter画像原寸ボタン」ver. 2.0公開 - hogashi.*](http://hogashi.hatenablog.com/entry/2016/01/01/234632)  


■ 参考元との主な違いなど
---
- アイデアを拝借、元のソースコードを参照しつつ、基本的にはいちから作成（なのでオリジナルでは発生しない不具合等もあるはず）。  
- デフォルト設定では、[原寸画像]ボタンクリック時に、画像を個別のタブではなく、一つのタブ（元のタイムラインと同一のタブ）上に、まとめて開く（DISPLAY_ALL_IN_ONE_PAGE = true 時・[Alt]＋クリックで個別のタブで開く）。  
- ユーザースクリプト版には、オプション設定機能はなし。必要な場合、インストール後に手動でソース上のパラメータ（OPTIONS）を変更すること（true ⇔ false）。  


■ 外部ライブラリなど
---
- [JSZip](https://stuk.github.io/jszip/)  
- [eligrey/FileSaver.js: An HTML5 saveAs() FileSaver implementation](https://github.com/eligrey/FileSaver.js/)  


■ 関連記事
---
- [Twitter 原寸びゅー：Twitterの原寸画像を開くGoogle Chrome拡張機能＆ユーザースクリプト公開 - 風柳メモ](http://furyu.hatenablog.com/entry/20160116/1452871567)  
