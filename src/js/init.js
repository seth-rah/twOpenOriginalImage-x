( ( chrome ) => {

'use strict';

const
    SCRIPT_NAME = 'twOpenOriginalImage',
    DEBUG = false,
    USE_XHR_MONITOR = false;

const
    log_debug = function () {
        if ( ! DEBUG ) {
            return;
        }
        const
            arg_list = [ '[' + SCRIPT_NAME + ']', '(' + ( new Date().toISOString() ) + ')' ];
        console.log.apply( console, arg_list.concat( [ ... arguments ] ) );
    }, // end of log_debug()
    
    log_info = function () {
        const
            arg_list = [ '[' + SCRIPT_NAME + ']', '(' + ( new Date().toISOString() ) + ')' ];
        console.info.apply( console, arg_list.concat( [ ... arguments ] ) );
    }, // end of log_info()
    
    log_warn = function () {
        const
            arg_list = [ '[' + SCRIPT_NAME + ']', '(' + ( new Date().toISOString() ) + ')' ];
        console.warn.apply( console, arg_list.concat( [ ... arguments ] ) );
    }, // end of log_warn()
    
    log_error = function () {
        const
            arg_list = [ '[' + SCRIPT_NAME + ']', '(' + ( new Date().toISOString() ) + ')' ];
        console.error.apply( console, arg_list.concat( [ ... arguments ] ) );
    }; // end of log_error()

if ( chrome.runtime.lastError ) {
    log_info( '* chrome.runtime.lastError.message:', chrome.runtime.lastError.message );
}


var current_url = location.href;

function get_bool( value ) {
    if ( value === undefined ) {
        return null;
    }
    if ( ( value === '0' ) || ( value === 0 ) || ( value === false ) || ( value === 'false' ) ) {
        return false;
    }
    if ( ( value === '1' ) || ( value === 1 ) || ( value === true ) || ( value === 'true' ) ) {
        return true;
    }
    return null;
}  // end of get_bool()


function get_int( value ) {
    if ( isNaN( value ) ) {
        return null;
    }
    return parseInt( value, 10 );
} // end of get_int()


function get_text( value ) {
    if ( value === undefined ) {
        return null;
    }
    return String( value );
} // end of get_text()

const
    async_wait = (wait_msec) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(wait_msec);
            }, wait_msec);
        });
    },
    
    wait_background_ready = (() => {
        // [メモ] backgroundの処理を(async() => {…})(); に変更(2023/08/07)
        // →受信準備ができていない場合にエラーになるため、準備できるまで待つ
        const
            wait_msec = 10;
        let
            is_ready = false;
        
        return async () => {
            /*
            //[TODO] 最初だけのチェックだとなぜかその後のsendMessage()でもエラーが発生する場合がある模様
            //→暫定的に、常にチェック
            //if (is_ready) {
            //    return;
            //}
            */
            for (;;) {
                try {
                    const
                        response = await chrome.runtime.sendMessage({
                            type : 'HEALTH_CHECK_REQUEST',
                        });
                    if (response?.is_ready) {
                        log_debug('background is ready', response);
                        is_ready = true;
                        break;
                    }
                }
                catch (error) {
                    log_info('sendMessage() error', error);
                }
                log_debug(`background is not ready => retry after ${wait_msec} msec`);
                await async_wait(wait_msec);
            }
        };
    })();


async function send_content_scripts_info() {
    // content_scripts の情報を渡す
    /*
    //window.addEventListener( 'beforeunload', function ( event ) {
    //    // TODO: メッセージが送信できないケース有り ("Uncaught TypeError: Cannot read property 'sendMessage' of undefined")
    //    chrome.runtime.sendMessage( {
    //        type : 'NOTIFICATION_ONUNLOAD',
    //        info : {
    //            url : location.href,
    //            event : 'onbeforeunload',
    //        }
    //    }, function ( response ) {
    //    } );
    //} );
    */
    await wait_background_ready();
    try {
        const
            response = await chrome.runtime.sendMessage( {
                type : 'NOTIFICATION_ONLOAD',
                info : {
                    url : location.href,
                }
            } );
        log_debug( 'send_content_scripts_info(): sendMessage(NOTIFICATION_ONLOAD) response:', response );
    }
    catch ( error ) {
        log_error( 'send_content_scripts_info(): sendMessage(NOTIFICATION_ONLOAD) error', error );
    }
} // end of send_content_scripts_info()


function get_init_function( message_type, option_name_to_function_map, namespace ) {
    var option_names = [];
    
    Object.keys( option_name_to_function_map ).forEach( function ( option_name ) {
        option_names.push( option_name );
    } );
    
    function analyze_response( response ) {
        var options = {};
        
        if ( ! response ) {
            response = {};
        }
        
        Object.keys( option_name_to_function_map ).forEach( function ( option_name ) {
            if ( ! ( option_name in response ) ) {
                options[ option_name ] = null;
                return;
            }
            options[ option_name ] =  option_name_to_function_map[ option_name ]( response[ option_name ] );
        } );
        return options;
    }
    
    async function init( callback ) {
        new MutationObserver( ( records ) => {
            if ( current_url == location.href ) return;
            current_url = location.href;
            send_content_scripts_info();
        } ).observe( document.body, { childList : true, subtree : true } );
        
        await wait_background_ready();
        try {
            const
                // https://developer.chrome.com/extensions/runtime#method-sendMessage
                response = await chrome.runtime.sendMessage( {
                    type : message_type
                ,   names : option_names
                ,   namespace :  ( namespace ) ? namespace : ''
                } );
            log_debug( `init(): sendMessage(${message_type}) response:`, response );
            const
                options = analyze_response( response );
            callback( options );
        }
        catch ( error ) {
            log_error( `init(): sendMessage(${message_type}) error`, error );
            const
                options = analyze_response( null );
            callback( options );
        }
    }
    return init;
} // end of get_init_function()


var twOpenOriginalImage_chrome_init = ( function() {
    var option_name_to_function_map = {
            SHOW_IN_DETAIL_PAGE : get_bool
        ,   SHOW_IN_TIMELINE : get_bool
        ,   ENABLED_ON_TWEETDECK : get_bool
        ,   DISPLAY_ALL_IN_ONE_PAGE : get_bool
        ,   DISPLAY_OVERLAY : get_bool
        ,   OVERRIDE_CLICK_EVENT : get_bool
        ,   DISPLAY_ORIGINAL_BUTTONS : get_bool
        ,   OVERRIDE_GALLERY_FOR_TWEETDECK : get_bool
        ,   DOWNLOAD_HELPER_SCRIPT_IS_VALID : get_bool
        ,   SWAP_IMAGE_URL : get_bool
        ,   HIDE_DOWNLOAD_BUTTON_AUTOMATICALLY : get_bool
        ,   SUPPRESS_FILENAME_SUFFIX : get_bool
        ,   TAB_SORTING : get_bool
        ,   SAME_FILENAME_AS_IN_ZIP : get_bool
        ,   OPERATION : get_bool
        ,   WAIT_AFTER_OPENPAGE : get_int
        ,   TITLE_PREFIX : get_text
        ,   TWEET_LINK_TEXT : get_text
        ,   BUTTON_TEXT : get_text
        ,   BUTTON_HELP_DISPLAY_ALL_IN_ONE_PAGE : get_text
        ,   BUTTON_HELP_DISPLAY_ONE_PER_PAGE : get_text
        ,   DOWNLOAD_HELPER_BUTTON_TEXT : get_text
        };
    
    return get_init_function( 'GET_OPTIONS', option_name_to_function_map );
} )(); // end of twOpenOriginalImage_chrome_init()


var extension_functions = ( () => {
    var current_tab_id = -1,
        tab_sorting_is_valid = ( ( default_value ) => {
            ( async () => {
                await wait_background_ready();
                try {
                    const
                        response = await chrome.runtime.sendMessage( {
                            type : 'GET_OPTIONS',
                            names : [
                                'TAB_SORTING',
                            ],
                        } );
                    log_debug( 'sendMessage(GET_OPTIONS.TAB_SORTING) response:', response );
                    if ( response ) {
                        // ※オプションは非同期取得となるが、ユーザーがアクションを起こすまでに余裕があるので気にしない
                        const
                            tab_sorting_option_value = get_bool( response[ 'TAB_SORTING' ] );
                        
                        if ( tab_sorting_option_value !== null ) {
                            tab_sorting_is_valid = tab_sorting_option_value;
                        }
                        current_tab_id = response.tab_id;
                    }
                }
                catch ( error ) {
                    log_debug( 'sendMessage(GET_OPTIONS.TAB_SORTING) error:', error );
                }
            } )();
            return default_value;
        } )( true ),
        
        reg_sort_index = new RegExp( `^request=tab_sorting&script_name=${SCRIPT_NAME}&requested_tab_id=([^&]*)&request_id=(\\d+)&total=(\\d+)&ctrl_key_pushed=(true|false)&sort_index=(\\d+)` ),
        
        open_multi_tabs = ( urls, ctrl_key_pushed = false) => {
            var request_id = '' + new Date().getTime(),
                window_name_prefix = `request=tab_sorting&script_name=${SCRIPT_NAME}&requested_tab_id=${current_tab_id}&request_id=${request_id}&total=${urls.length}&ctrl_key_pushed=${ctrl_key_pushed}&sort_index=`;
            
            urls.reverse().forEach( ( url, index ) => {
                var sort_index = urls.length - index,
                    window_name = ( tab_sorting_is_valid ) ? ( window_name_prefix + sort_index ) : '_blank';
                
                window.open( url, window_name );
            } );
        }, // end of open_multi_tabs()
        
        request_tab_sorting = () => {
            var reg_result = ( window.name || '' ).match( reg_sort_index );
            
            if ( ! reg_result ) {
                return;
            }
            
            var requested_tab_id = parseInt( reg_result[ 1 ], 10 ),
                request_id = reg_result[ 2 ],
                total = reg_result[ 3 ],
                ctrl_key_pushed = (reg_result[ 4 ] == 'true'),
                sort_index = reg_result[ 5 ];
            
            ( async () => {
                await wait_background_ready();
                try {
                    const
                        response = await chrome.runtime.sendMessage( {
                            type : 'TAB_SORT_REQUEST',
                            requested_tab_id,
                            request_id,
                            total,
                            sort_index,
                            ctrl_key_pushed,
                        } );
                    log_debug( 'request_tab_sorting(): sendMessage(TAB_SORT_REQUEST) response:', response );
                }
                catch ( error ) {
                    log_error( 'request_tab_sorting(): sendMessage(TAB_SORT_REQUEST) error:', error );
                }
            } )();
            
            try {
                window.name = '';
            }
            catch ( error ) {
            }
        }; // end of request_tab_sorting()
    
    const
        extension_functions = {
            open_multi_tabs,
            request_tab_sorting,
            get_tweet_info : null,
            async_get_tweet_info : null,
        };
    
    ( async () => {
        const
            reg_graphql_api = new RegExp( '^/i/api/graphql/([^/]+)/([^?]+)' ),
            
            is_target_instruction_type = ( instruction ) => ( [ 'TimelineAddEntries', 'TimelinePinEntry', ].includes( instruction.type ) ),
            
            tweet_info_map = {},
            
            get_tweet_info = ( tweet_id ) => {
                const
                    tweet_info = tweet_info_map[ tweet_id ];
                log_debug( 'get_tweet_info():', tweet_id, '=>', tweet_info );
                return tweet_info ?? null;
            },
            
            async_get_tweet_info = async ( tweet_id ) => {
                const
                    tweet_info = get_tweet_info( tweet_id );
                
                if ( tweet_info ) {
                    return tweet_info;
                }
                
                const
                    operationName = 'TweetDetail';
                
                try {
                    const
                        response_object = await window.tweet_api.call_graphql_api( {
                            operationName : `${operationName}`,
                            query_params : {
                                variables : JSON.stringify( {
                                    'focalTweetId' : `${tweet_id}`,
                                    'with_rux_injections' : false,
                                    'includePromotedContent' : true,
                                    'withCommunity' : true,
                                    'withQuickPromoteEligibilityTweetFields' : true,
                                    'withBirdwatchNotes' : true,
                                    'withVoice' : true,
                                    'withV2Timeline' : true,
                                } ),
                            }
                        } );
                    analyze_graphql_api_result( operationName, response_object );
                    const
                        tweet_info = get_tweet_info( tweet_id );
                    return tweet_info;
                }
                catch ( error ) {
                    log_error( 'tweet_api.call_graphql_api() error:', error );
                    return null;
                }
            },

            append_tweet_info = ( tweet_result ) => {
                log_debug( 'append_tweet_info(): tweet_result=', tweet_result );
                const
                    quoted_result = tweet_result?.quoted_status_result?.result;
                
                if ( quoted_result ) {
                    append_tweet_info( quoted_result );
                }
                const
                    retweed_result = tweet_result?.legacy?.retweeted_status_result?.result,
                    tweet_result_legacy = ( retweed_result ?? tweet_result )?.legacy ?? {},
                    user_result_legacy = ( retweed_result ?? tweet_result )?.core?.user_results?.result?.legacy ?? {},
                    tweet_id = tweet_result_legacy?.id_str,
                    retweet_id = ( retweed_result ) ? tweet_result?.legacy?.id_str : null,
                    quoted_tweet_id = quoted_result?.legacy?.id_str ?? null,
                    url_info_list = tweet_result_legacy?.entities?.urls ?? [],
                    media_list = tweet_result_legacy?.extended_entities?.media ?? tweet_result_legacy?.entities?.media ?? [],
                    full_text = ( ( full_text ) => {
                        full_text = url_info_list.reduce( ( full_text, url_info ) => {
                            try {
                                return full_text.replaceAll( url_info.url, url_info.expanded_url );
                            }
                            catch ( error ) {
                                return full_text;
                            }
                        }, full_text ?? '' );
                        full_text = media_list.reduce( ( full_text, media_info ) => {
                            try {
                                return full_text.replaceAll( media_info.url, media_info.expanded_url );
                            }
                            catch ( error ) {
                                return full_text;
                            }
                        }, full_text );
                        return full_text;
                    } )( tweet_result?.note_tweet?.note_tweet_results?.result?.text ?? tweet_result_legacy?.full_text ),
                    tweet_info = {
                        tweet_id,
                        user : {
                            id : tweet_result_legacy?.user_id_str,
                            screen_name : user_result_legacy?.screen_name,
                            name : user_result_legacy?.name,
                        },
                        full_text : full_text,
                        created_at : tweet_result_legacy?.created_at,
                        url_info_list,
                        media_list,
                        retweet_id,
                        quoted_tweet_id,
                        quoted_tweet_url : ( ! quoted_tweet_id ) ? null : ( quoted_result?.legacy?.quoted_status_permalink?.expanded ?? `https://x.com/${quoted_result?.core?.user_results?.result?.legacy?.screen_name ?? 'i'}/status/${quoted_tweet_id}` ),
                    };
                tweet_info_map[ tweet_id ] = tweet_info;
                log_debug( 'append_tweet_info(): tweet_id=', tweet_id, tweet_info );
            },
            
            analyze_entry = ( entry ) => {
                log_debug( 'analyze_entry(): ', entry );
                const
                    entryType = entry?.content?.entryType;
                
                switch ( entryType ) {
                    case 'TimelineTimelineItem' : {
                        const
                            item_type = entry?.content?.itemContent?.itemType;
                        if ( item_type != 'TimelineTweet' ) {
                            log_debug( `item_type: ${item_type} => ignored`, entry );
                            break;
                        }
                        const
                            tweet_result = entry?.content?.itemContent?.tweet_results?.result;
                        if ( ! tweet_result ) {
                            log_warn( `TimelineTimelineItem: tweet_result not found(item_type=${item_type})`, entry );
                            break;
                        }
                        append_tweet_info( tweet_result );
                        break;
                    }
                    case 'TimelineTimelineModule' : {
                        ( entry?.content?.items || [] ).map( ( content_item ) => {
                            const
                                item_type = content_item?.item?.itemContent?.itemType;
                            if ( item_type != 'TimelineTweet' ) {
                                log_debug( `item_type: ${item_type} => ignored`, entry );
                                return;
                            }
                            const
                                tweet_result = content_item?.item?.itemContent?.tweet_results?.result;
                            if ( ! tweet_result ) {
                                log_warn( `TimelineTimelineModule: tweet_result not found(item_type=${item_type})`, content_item, entry );
                                return;
                            }
                            append_tweet_info( tweet_result );
                        } );
                        break;
                    }
                }
            },
            
            graphql_api_operation_name_map = {
                HomeTimeline : ( response_object ) => {
                    ( response_object?.data?.home?.home_timeline_urt?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                HomeLatestTimeline : ( response_object ) => {
                    ( response_object?.data?.home?.home_timeline_urt?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                ListLatestTweetsTimeline : ( response_object ) => {
                    ( response_object?.data?.list?.tweets_timeline?.timeline?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                UserMedia : ( response_object ) => {
                    ( response_object?.data?.user?.result?.timeline_v2?.timeline?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                UserTweets : ( response_object ) => {
                    ( response_object?.data?.user?.result?.timeline_v2?.timeline?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                UserTweetsAndReplies : ( response_object ) => {
                    ( response_object?.data?.user?.result?.timeline_v2?.timeline?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                Likes : ( response_object ) => {
                    ( response_object?.data?.user?.result?.timeline_v2?.timeline?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                UserHighlightsTweets : ( response_object ) => {
                    ( response_object?.data?.user?.result?.timeline?.timeline?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                Bookmarks : ( response_object ) => {
                    ( response_object?.data?.bookmark_timeline_v2?.timeline?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                ArticleTweetsTimeline : ( response_object ) => {
                    ( response_object?.data?.article_by_rest_id?.tweets_timeline?.timeline?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                TweetDetail : ( response_object ) => {
                    ( response_object?.data?.threaded_conversation_with_injections_v2?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
                
                SearchTimeline : ( response_object ) => {
                    ( response_object?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions ?? [] )
                        .filter( is_target_instruction_type )
                        .map( ( instruction ) => ( ( instruction?.entry ? [ instruction?.entry ] : instruction?.entries ) ?? [] ).map( ( entry ) => {
                            analyze_entry( entry );
                        } ) );
                },
            },
            
            analyze_graphql_api_result = ( operationName, response_object ) => {
                log_debug( `[${operationName}] response_object:`, response_object );
                const
                    graphql_api_operation = graphql_api_operation_name_map[ operationName ];
                
                if ( ! graphql_api_operation ) {
                    log_debug( `Unsupported operation: ${operationName}`, response_object );
                    return;
                }
                graphql_api_operation( response_object );
            };
        
        if ( USE_XHR_MONITOR ) {
            window.addEventListener( 'message', ( event ) => {
                if ( event.origin != location.origin ) {
                    return;
                }
                const
                    data = event.data;
                
                if ( data?.monitor_id != 'twOpenOriginalImage.tweet-capture' ) {
                    return;
                }
                
                const
                    url_obj = new URL( data.url ),
                    [ api_path, queryId, operationName ] = url_obj.pathname.match( reg_graphql_api ) ?? [ null, null, null ];
                
                if ( ! operationName ) {
                    return;
                }
                log_debug( `${operationName} : ${data.url}, data=`, data );
                
                if ( ! data.response_object ) {
                    return;
                }
                analyze_graphql_api_result( operationName, data.response_object );
            } );
            
            let
                injected_script_infos;
            
            injected_script_infos = await window.inject_script_all( [
                'js/xhr_monitor.js',
            ] );
            log_debug( '[js/xhr_monitor.js]', injected_script_infos);
            
            injected_script_infos = await window.inject_script_all( [
                'js/set_xhr_monitor.js',
            ] );
            log_debug( '[js/set_xhr_monitor.js]', injected_script_infos);
        }
        
        extension_functions.get_tweet_info = get_tweet_info;
        
        // tweet_api.jsでtweet_api.call_graphql_api()が登録されるのを待つ
        for (;;) {
            if ( typeof window?.tweet_api?.call_graphql_api == 'function' ) {
                extension_functions.async_get_tweet_info = async_get_tweet_info;
                break;
            }
            if ( window?.tweet_api?.register_error ) {
                log_error( 'failed to register tweet_api:', window.tweet_api.register_error );
                break;
            }
            log_debug( 'tweet_api.call_graphql_api() is not found => check again later' );
            await async_wait( 100 );
        }
    } )();
    
    return extension_functions;
} )(); // end of extension_functions


chrome.runtime.onMessage.addListener( function ( message, sender, sendResponse ) {
    switch ( message.type )  {
        case 'DOWNLOAD_IMAGE_REQUEST' :
            if ( ( ! message.img_url_orig ) || ( ! message.filename ) ) {
                sendResponse( {
                    result : 'NG',
                    message : 'parameter error'
                } );
                return false;
            }
            
            fetch( message.img_url_orig )
            .then( ( response ) => response.blob() )
            .then( ( blob ) => {
                try {
                    if ( typeof saveAs == 'function' ) {
                        //window.saveAs( blob, message.filename ); // Firefoxでは saveAs は window 下に存在しない
                        saveAs( blob, message.filename );
                    }
                    else {
                        var link = document.createElement('a');
                        
                        link.href = URL.createObjectURL( blob );
                        link.download = message.filename;
                        document.documentElement.appendChild( link );
                        link.click(); // TweetDeck だと、ダウンロードできない（ダウンロードが無効化されるイベントが設定されてしまう）=> saveAs() が有効ならばそちらを使用
                        document.documentElement.removeChild( link );
                    }
                    sendResponse( {
                        result : 'OK'
                    } );
                }
                catch( error ) {
                    log_error( 'save image error:', error, message.img_url_orig, blob );
                    sendResponse( {
                        result : 'NG',
                        message : 'save image error'
                    } );
                }
            } )
            .catch( ( error ) => {
                log_error( 'fetch() error:', error, message.img_url_orig );
                sendResponse( {
                    result : 'NG',
                    message : 'fetch() error'
                } );
            } );
            break;
        
        case 'RELOAD_REQUEST' :
            sendResponse( {
                result : 'OK'
            } );
            
            setTimeout( () => {
                location.reload();
            }, 100 );
            break;
        
        default :
            sendResponse( {
                result : 'NG',
                message : 'unknown type'
            } );
            return false;
    }
    return true;
} );

if ( /^https?:\/\/pbs\.twimg\.com\/media\//.test( location.href ) ) {
    // 複数画像を一度に開いたときにタブを並び替え
    extension_functions.request_tab_sorting();
}

window.twOpenOriginalImage_chrome_init = twOpenOriginalImage_chrome_init;
window.extension_functions = extension_functions;

send_content_scripts_info();

} )( ( ( typeof browser != 'undefined' ) && browser.runtime ) ? browser : chrome );

// ■ end of file
