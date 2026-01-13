// ==UserScript==
// @name        #2 Auto Rekru
// @icon                https://dscs.innogamescdn.com/asset/4d47dbcf/graphic//buildings/barracks.png
// @match     https://*&screen=train*
// @match     https://*&screen=barracks*
// @match     https://*&screen=stable*
// @match     https://*&screen=garage*
// @match     https://csc1.divokekmeny.cz/game.php?village=68&screen=train
// @match     https://its1.tribals.it/game.php?village=68&screen=train
// @match https://*.divokekmeny.cz/game.php?*screen=train*
// @match https://*.divokekmeny.cz/game.php?*screen=barracks*
// @match https://*.divokekmeny.cz/game.php?*screen=stable*
// @match https://*.plemiona.pl/game.php?*screen=train*
// @match https://*.plemiona.pl/game.php?*screen=barracks*
// @match https://*.plemiona.pl/game.php?*screen=stable*
// @match https://*.tribals.it/game.php?*screen=train*
// @match https://*.tribals.it/game.php?*screen=barracks*
// @match https://*.tribals.it/game.php?*screen=stable*
// @match https://*.die-staemme.de/game.php?*screen=train*

// ==/UserScript==

(async (ModuleLoader, unitConfig) => {
    'use strict';

    //****************************** Nastavení ******************************//
    let reloadInterval = localStorage.getItem(`${game_data.world}_${game_data.player.id.toString()}_reloadInterval`);
        if (reloadInterval == null) {
            reloadInterval = 480000;
            let reloadInterval_sec = reloadInterval / 1000;
            localStorage.setItem(`${game_data.world}_${game_data.player.id.toString()}_reloadInterval`, reloadInterval_sec.toString());
        } else {
            reloadInterval = (parseInt(reloadInterval))*1000;
        }

    console.log(localStorage.getItem(`${game_data.world}_${game_data.player.id.toString()}_reloadInterval`));


        let minimumQueueSize = localStorage.getItem(`${game_data.world}_${game_data.player.id.toString()}_queue_length`);
        if (minimumQueueSize == null) {
            minimumQueueSize = 2;
            localStorage.setItem(`${game_data.world}_${game_data.player.id.toString()}_queue_length`, minimumQueueSize);
        } else {
            minimumQueueSize = parseInt(minimumQueueSize);
        }
    console.log(minimumQueueSize);
    //*************************** Konec nastavení ***************************//

    // Nastavení pro zobrazení jednotek při rekrutaci
    $("#content_value > p").append($(unitConfig));


    await ModuleLoader.loadModule('utils/notify-utils');
    await ModuleLoader.loadModule('utils/config-utils');


    TwFramework.setIdleTitlePreffix('Rekrutuji jednotky', document.title);

    const addGlobalStyle = (css) => {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        document.getElementsByTagName('head')[0].appendChild(style);
    }
    addGlobalStyle('#CR-rtable td {text-align:center;} #CR-rtable #un_qtds td {width:20px;} .CR-rcontainer {padding: 20px 0px; margin: 0;} input.CR-ri{width: 50px;}');

    let unitData = {
        'spear': 0,
        'sword': 0,
        'axe': 1,
        'spy': 0,
        'light': 1,
        'heavy': 0,
        'ram': 1,
        'catapult': 0,
        'snob': 0
    };

    // Try to recruit

    const _recruitIfPossible = () => {
        // if not active, abort!
        if (TwFramework.readConfiguration('CR_active', 2) != 1) {
            return;
        }
        let canRecruit = false;
        Object.keys(unitData)
            .filter(e => unitData[e] > 0)
            .forEach(key => {
                // Initialize input variable
                const input = $(`input[name="${key}"]`);
                if (!input.length) {
                    return;
                }

                        // Stelle sicher, dass die Input-Felder #CR-u-queue und #CR-u-reload nicht betroffen sind
            if (input.attr('id') === 'CR-u-queue' || input.attr('id') === 'CR-u-reload') {
                return; // Überspringe diese Felder
            } else {
            input.val('');
            }

                // If there's no recruit order already on the queue
                if ($(`.unit_sprite_smaller.${key}`).length < minimumQueueSize) {
                    input.val(unitData[key]);
                    // Can recruit!
                    if (input[0].style.color === 'black') {
                        canRecruit = true;
                    } else if (input[0].style.color === 'red') {
                        input.val('');
                    }
                }
            });

        if (canRecruit) {
            $(".btn-recruit").click();
        }
    };

    // Update the UI with the data
    const _updateUI = () => {
        Object.keys(unitData).forEach(key => {
            $(`#CR-u-${key}`).val(unitData[key] > 0 ? unitData[key] : '');
                    let currentQueueLength = localStorage.getItem(`${game_data.world}_${game_data.player.id.toString()}_queue_length`);
        $('#CR-u-queue').val(currentQueueLength ? currentQueueLength : 2);

        let reload_intervall = localStorage.getItem(`${game_data.world}_${game_data.player.id.toString()}_reloadInterval`);
        $('#CR-u-reload').val(reload_intervall ? reload_intervall : 480);
        });
    };

    const _loadButtonLiterals = () => {
        if (TwFramework.readConfiguration('CR_active', 2) == 1) {
            $('#CR-toggle-btn').text('Bot beenden');
        } else {
            $('#CR-toggle-btn').text('Bot starten');
        }
    };

    $(() => {
        let currentQueueLength = localStorage.getItem(`${game_data.world}_${game_data.player.id.toString()}_queue_length`);
        $('#CR-u-queue').val(currentQueueLength ? currentQueueLength : 2);

        let reload_intervall = localStorage.getItem(`${game_data.world}_${game_data.player.id.toString()}_reloadInterval`);
        $('#CR-u-reload').val(reload_intervall ? reload_intervall : 480);


        unitData = TwFramework.readConfiguration('CR_unitData', unitData);
        _updateUI();
        Object.keys(unitData).forEach(key => {
            // Updates value on memory
            $(`#CR-u-${key}`).change(evt => {
                unitData[key] = evt.target.value;
            })
        });

        // Writes everything on the screen
        $('input.btn.btn-recruit').click(() => {
            setTimeout(() => {
                unitData = TwFramework.readConfiguration('CR_unitData', unitData);
                _updateUI();
            }, 500);
        });

        // Saves on the localStorage
        $('#CR-save-btn').click(() => {
            TwFramework.saveConfiguration('CR_unitData', unitData);
            let queue_length = document.querySelector("#CR-u-queue").value;
            let reload_in_seconds = document.querySelector("#CR-u-reload").value;
            localStorage.setItem(`${game_data.world}_${game_data.player.id.toString()}_queue_length`, queue_length);
            localStorage.setItem(`${game_data.world}_${game_data.player.id.toString()}_reloadInterval`, reload_in_seconds);


            UI.Notification.show("https://th.bing.com/th/id/OIP.5R-ae5VM-10Ijm1Dxd7QdAHaHY?pid=Api&rs=1", 'Done!', 'Settings saved successfully!');
        })

        // Start/Stop button
        $('#CR-toggle-btn').click(() => {
            // Toggle current status
            if (TwFramework.readConfiguration('CR_active', 2) == 1) {
                TwFramework.saveConfiguration('CR_active', 2);
            } else TwFramework.saveConfiguration('CR_active', 1);
            _loadButtonLiterals();
        })

        // Run
        _loadButtonLiterals();
        _recruitIfPossible();
    });

    // Loop to check if can recruit
    setInterval(() => location.reload(true), reloadInterval);

    // border: 3px solid #e5c27e;
    // border-radius: 22px;
    // padding: 0px 8px;
    // margin-top: 5px;
})({
    // ModuleLoader functions
    loadModule: moduleName => {
        return new Promise((resolve, reject) => {
            const modulePath = moduleName.replace('.', '/');
            const moduleUrl = `https://raw.githubusercontent.com/joaovperin/TribalWars/master/Modules/${modulePath}.js`;
            console.debug('[TwScripts] Loading ', modulePath, ' from URL ', moduleUrl, '...');
            return $.ajax({
                    method: "GET",
                    url: moduleUrl,
                    dataType: "text"
                }).done(res => resolve(eval(res)))
                .fail(req => reject(console.error("[TwScripts] Fail loading module '", moduleName, "'.")));
        })
    }
}, `<div class="CR-rcontainer"><h3></h3>
<table id="CR-rtable" style="margin-bottom: 10px" class="vis" width="100%">
    <tbody>
        <tr>
            <th style="text-align:center">
                <a href="#" class="unit_link" data-unit="spear"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_spear.png" title="Spear fighter" alt="Spear"></a>
            </th>
            <th style="text-align:center">
                <a href="#" class="unit_link" data-unit="sword"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_sword.png" title="Swordsman" alt="Sword"></a>
            </th>
            <th style="text-align:center">
                <a href="#" class="unit_link" data-unit="axe"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_axe.png" title="Axeman" alt="Axe"></a>
            </th>
            <th style="text-align:center">
                <a href="#" class="unit_link" data-unit="spy"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_spy.png" title="Scout" alt="Scout"></a>
            </th>
            <th style="text-align:center">
                <a href="#" class="unit_link" data-unit="light"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_light.png" title="Light cavalry" alt="Light Cavalry"></a>
            </th>
            <th style="text-align:center">
                <a href="#" class="unit_link" data-unit="heavy"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_heavy.png" title="Heavy cavalry" alt="Heavy Cavalry"></a>
            </th>
            <th style="text-align:center">
                <a href="#" class="unit_link" data-unit="ram"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_ram.png" title="Ram" alt="Ram"></a>
            </th>
            <th style="text-align:center">
                <a href="#" class="unit_link" data-unit="catapult"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_catapult.png" title="Catapult" alt="Catapult"></a>
            </th>
            <th style="text-align:center">
                <a href="#" class="unit_link" data-unit="snob"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_snob.png" title="Nobleman" alt="Nobleman"></a>
            </th>
        </tr>
        <tr id="un_qtds">
            <td class="unit-item unit-item-spear hidden"><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-spear"></td>
            <td class="unit-item unit-item-sword hidden"><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-sword"></td>
            <td class="unit-item unit-item-axe hidden"><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-axe"></td>
            <td class="unit-item unit-item-spy hidden"><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-spy"></td>
            <td class="unit-item unit-item-light hidden"><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-light"></td>
            <td class="unit-item unit-item-heavy hidden"><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-heavy"></td>
            <td class="unit-item unit-item-ram hidden"><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-ram"></td>
            <td class="unit-item unit-item-catapult hidden"><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-catapult"></td>
            <td class="unit-item unit-item-snob hidden"><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-snob"></td>
        </tr>
    </tbody>
</table>
<table>
<tbody>
<tr>
<td>Max. Truppenschleife:</td>
<td><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-queue"></td>
<td></td>
</tr>
<tr>
<td>Reload-Intervall:</td>
<td><input maxlenght="5" class="CR-ri recruit_unit" type="number" id="CR-u-reload"></td>
<td>s</td>
</tr>
</tbody>
</table>
<button id='CR-toggle-btn' class='btn'>Bot starten</button>
<button id='CR-save-btn' class='btn'>Einstellungen speichern</button>
</div>`);