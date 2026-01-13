// ==UserScript==
// @name         RZ Bot
// @version      1.3
// @author       Heazy
// @description  Tribal Wars - Raid Bot
// @include      https://*.die-staemme.de/game.php?*screen=place&mode=scavenge*
// @exclude      https://*.die-staemme.de/game.php?*screen=place&mode=scavenge_mass*
// @require      https://userscripts-mirror.org/scripts/source/107941.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function(root, $) {
    'use strict';

    const ready = (selector, callback) => {
        $(selector).length ? callback() : setTimeout(() => ready(selector, callback), 100);
    };

    (function inject() {
        if (typeof game_data === 'undefined') {
            setTimeout(inject, 100);
        } else {
            const game = {
                world: game_data.world,
                ui: () => { return UI },
                scavenge: () => { return ScavengeScreen }
            };

            const check = abc => {
                if ($('div#bot_check, div#popup_box_bot_protection').length) {
                    let html = '<h2 style="text-align: center; color: red;">' + Date() + '</h2>';

                    if ($('div#bot_check').length) {
                        $('div#bot_check').append(html);
                    } else {
                        $('div.popup_box_content').append(html);
                    }

                    // external Anti-Bot-Check
                    if (abc) {
                        $('div#bot_check, div#popup_box_bot_protection').find('iframe').css('padding', '4px 3px 2px 4px').css('background-color', '#abc');

                        root.document.title = 'TKK ABC';
                    }

                    return false;
                } else {
                    return true;
                }
            };

            ready('table.candidate-squad-widget td:last', () => {
                let knight = GM_getValue('tkk.raid.useKnight.' + game.world) || false;

                let population = { spear: 1, sword: 1, axe: 1, archer: 1, light: 4, marcher: 5, heavy: 6, knight: 10 };

                let distribution = {
                    1: [[1]],
                    2: [[2/7, 5/7], [1]],
                    3: [[1/8, 2/8, 5/8], [1/3, 2/3], [1]],
                    4: [[2/26, 3/26, 6/26, 15/26], [2/11, 3/11, 6/11], [2/5, 3/5], [1]]
                };

                let html = '<td style="text-align: center;"><div style="width: 100%;">';
                html += '<input type="checkbox" id="tkk-knight" style="width: 15px; vertical-align: -2px;"' + (knight ? ' checked' : '') + '/>Paladin</div>';
                html += '<input type="button" id="tkk-start" value="&#10004;" class="btn"/></td>';

                $('table.candidate-squad-widget th:last').after('<th>[TKK] Raid Bot</th>');
                $('table.candidate-squad-widget td:last').after(html);

                $('input#tkk-knight').click(function(event) {
                    knight = $(this).prop('checked');

                    GM_setValue('tkk.raid.useKnight.' + game.world, knight);
                });

                $('input#tkk-start').click(function(event) {
                    $(this).prop('disabled', true);

                    run();
                });

                let run = () => {
                    if (check()) {
                        if ($('span.return-countdown').length) {
                            let [h, m, s] = $('span.return-countdown:last').text().split(':');
                            let delay = (parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) || 1) * 1000 + 5000;

                            setTimeout(run, delay);
                        } else {
                            let raids = $('a.free_send_button').length;

                            if (raids) {
                                let units = {};

                                for (let unit in population) {
                                    let match = $('a[data-unit="' + unit + '"]').text().match(/\d+/);
                                    let quantity = parseInt(match ? match[0] : 0);
                                    if (!knight && unit === 'knight') quantity = 0;

                                    units[unit] = { quantity: quantity };
                                }

                                for (let i = 0; i < raids; i++) {
                                    let skip = false;
                                    let assignments = {};

                                    for (let ii = 0; ii < distribution[raids][i].length; ii++) {
                                        let counter = 0;

                                        assignments[ii] = {};

                                        for (let unit in units) {
                                            let quantity = Math.floor(units[unit].quantity * distribution[raids][i][ii]);

                                            counter += population[unit] * quantity;
                                            assignments[ii][unit] = quantity;
                                        }

                                        if (counter < 10) {
                                            skip = true;

                                            break;
                                        }
                                    }

                                    if (skip) {
                                        if (i === raids - 1) {
                                            $('input#tkk-start').prop('disabled', false);

                                            game.ui().ErrorMessage('[TKK] Raid Bot: Es sind nicht genug Einheiten im Dorf!');
                                        }
                                    } else {
                                        bot(assignments, 0);

                                        break;
                                    }
                                }
                            } else {
                                setTimeout(run, 5000);
                            }
                        }
                    }
                };

                let bot = (assignments, key) => {
                    if (check()) {
                        setTimeout(() => {
                            for (let unit in assignments[key]) {
                                let quantity = assignments[key][unit];
                                if (quantity) game.scavenge().candidate_squad.setUnitCount(unit, quantity);
                            }

                            setTimeout(() => {
                                $('a.free_send_button:last').mousedown().click().mouseup();

                                setTimeout(() => {
                                    assignments[key + 1] ? bot(assignments, key + 1) : run();
                                }, 5000);
                            }, 1000);
                        }, 1000);
                    }
                };
            });
        }
    })();
})(this, jQuery);
