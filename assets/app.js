
"use strict";


const state = {

    meta:null,
    profileMeta:null,

    brA:[],
    brM:[],

    ufA:[],
    ufM:[],

    geoUF:null,
    geoBR:null,

    abrangencia:"municipios",
    region:"BR",

    geoMun:null,
    munA:[],

    munCache:{},
    profileMunCache:{},

    profileBR:[],
    profileUF:[],

    selectedMunicipio:null,

    ano:null,
    forma:0,
    tipo:0,

    metrica:"alertas",
    classificacao:"quantis",

    linha:"mensal",
    sidebar:"perfil",

    playing:false,
    timer:null
};


const $ =
id =>
    document.getElementById(id);


const fmtInt =
new Intl.NumberFormat(
    "pt-BR",
    {
        maximumFractionDigits:0
    }
);


const fmt1 =
new Intl.NumberFormat(
    "pt-BR",
    {
        minimumFractionDigits:1,
        maximumFractionDigits:1
    }
);


const fmt2 =
new Intl.NumberFormat(
    "pt-BR",
    {
        minimumFractionDigits:2,
        maximumFractionDigits:2
    }
);


const COLORS = [

    "#eef3f6",
    "#d8e6ee",
    "#accbdc",
    "#74a9c4",
    "#3e82a6",
    "#1f5d82"

];


const categoryTranslation = {

    "Severe":"Severa",
    "Moderate":"Moderada",
    "Extreme":"Extrema",
    "Minor":"Menor",

    "Immediate":"Imediata",
    "Expected":"Esperada",
    "Future":"Futura",
    "Past":"Passada",

    "Observed":"Observada",
    "Likely":"Provável",
    "Possible":"Possível",
    "Unlikely":"Improvável",

    "Execute":"Executar",
    "Monitor":"Monitorar",
    "Shelter":"Abrigar-se",
    "Prepare":"Preparar-se",
    "Avoid":"Evitar",
    "Evacuate":"Evacuar",
    "None":"Nenhuma",

    "CONFLITO":"Conflito",
    "Sem informação":"Sem informação"
};


function trCategory(x) {

    return (
        categoryTranslation[x]
        ||
        x
    );
}


async function loadJSON(path) {

    const r =
        await fetch(path);


    if (!r.ok) {

        throw new Error(
            `Falha ao carregar ${path}`
        );
    }


    return await r.json();
}


function setGlobalLoading(on) {

    let n =
        $("global-loading");


    if (
        on
        &&
        !n
    ) {

        n =
            document.createElement(
                "div"
            );


        n.id =
            "global-loading";


        n.className =
            "global-loading";


        n.textContent =
            "Carregando painel...";


        document.body.appendChild(
            n
        );

    } else if (
        !on
        &&
        n
    ) {

        n.remove();
    }
}


function mapLoading(on) {

    $("map-loading")
        .classList
        .toggle(
            "hidden",
            !on
        );
}


function profileLoading(on) {

    $("profile-loading")
        .classList
        .toggle(
            "hidden",
            !on
        );
}


async function init() {

    setGlobalLoading(true);


    try {

        const [
            meta,
            geoUF,
            geoBR,
            brA,
            brM,
            ufA,
            ufM,
            pMeta,
            pBR,
            pUF
        ] =
        await Promise.all([

            loadJSON(
                "data/meta.json"
            ),

            loadJSON(
                "geo/ufs.geojson"
            ),

            loadJSON(
                "geo/municipios/BR.geojson"
            ),

            loadJSON(
                "data/brasil_anual.json"
            ),

            loadJSON(
                "data/brasil_mensal.json"
            ),

            loadJSON(
                "data/ufs_anual.json"
            ),

            loadJSON(
                "data/ufs_mensal.json"
            ),

            loadJSON(
                "data/perfil/meta.json"
            ),

            loadJSON(
                "data/perfil/brasil_anual.json"
            ),

            loadJSON(
                "data/perfil/ufs_anual.json"
            )
        ]);


        Object.assign(
            state,
            {
                meta,
                geoUF,
                geoBR,
                brA,
                brM,
                ufA,
                ufM,
                profileMeta:pMeta,
                profileBR:pBR,
                profileUF:pUF
            }
        );


        state.ano =
            meta.anos.includes(2025)
            ?
            2025
            :
            meta.anos[
                meta.anos.length - 1
            ];


        const chuva =
            meta.tipos.indexOf(
                "CHUVAS INTENSAS"
            );


        state.tipo =
            chuva >= 0
            ?
            chuva
            :
            0;


        state.geoMun =
            geoBR;


        state.munA =
            await loadJSON(
                "data/municipios/BR_anual.json"
            );


        state.munCache.BR = {

            geo:
                geoBR,

            anual:
                state.munA,

            mensal:
                null
        };


        populateControls();

        fillInfo();

        bindEvents();

        updateAll();

    }

    catch(e) {

        console.error(e);


        document.body.innerHTML = `

            <div style="
                padding:40px;
                font-family:Arial
            ">

                <h2>
                    Não foi possível carregar o painel
                </h2>

                <p>
                    ${e.message}
                </p>

                <p>
                    Abra pelo GitHub Pages.
                </p>

            </div>
        `;
    }

    finally {

        setGlobalLoading(false);
    }
}


function populateControls() {

    $("tipo").innerHTML =
        "";


    state.meta.tipos.forEach(
        (x,i) => {

            const o =
                document.createElement(
                    "option"
                );


            o.value =
                i;


            o.textContent =
                x;


            $("tipo").appendChild(
                o
            );
        }
    );


    $("tipo").value =
        state.tipo;


    $("forma").innerHTML =
        "";


    state.meta.formas.forEach(
        (x,i) => {

            const o =
                document.createElement(
                    "option"
                );


            o.value =
                i;


            o.textContent =
                x;


            $("forma").appendChild(
                o
            );
        }
    );


    const ufs = [

        "AC","AL","AM","AP","BA","CE","DF",
        "ES","GO","MA","MG","MS","MT","PA",
        "PB","PE","PI","PR","RJ","RN","RO",
        "RR","RS","SC","SE","SP","TO"

    ];


    ufs.forEach(
        uf => {

            const o =
                document.createElement(
                    "option"
                );


            o.value =
                uf;


            o.textContent =
                uf;


            $("uf").appendChild(
                o
            );
        }
    );


    $("ano").innerHTML =
        "";


    state.meta.anos.forEach(
        ano => {

            const o =
                document.createElement(
                    "option"
                );


            o.value =
                ano;


            o.textContent =
                ano === 2026
                ?
                "2026*"
                :
                ano;


            $("ano").appendChild(
                o
            );
        }
    );


    $("ano").value =
        state.ano;


    $("slider").min =
        0;


    $("slider").max =
        state.meta.anos.length - 1;


    $("slider").value =
        state.meta.anos.indexOf(
            state.ano
        );


    updateSliderLabel();

    updateMetricOptions();
}


function fillInfo() {

    const ini =
        formatDate(
            state.meta.periodo_inicial
        );


    const fim =
        formatDate(
            state.meta.periodo_final
        );


    $("periodo-base").textContent =
        `${ini} — ${fim}`;


    $("info-periodo").textContent =
        `${ini} a ${fim}`;


    $("info-observacao").textContent =
        state.meta.ultimo_mes_parcial
        ?
        `Mês parcial, com dados até ${fim}.`
        :
        "Último mês completo.";
}


function bindEvents() {

    $("tipo").addEventListener(
        "change",
        () => {

            state.tipo =
                Number(
                    $("tipo").value
                );


            clearMunicipio();

            updateMetricOptions();

            updateAll();
        }
    );


    $("forma").addEventListener(
        "change",
        () => {

            state.forma =
                Number(
                    $("forma").value
                );


            clearMunicipio();

            updateAll();
        }
    );


    $("abrangencia").addEventListener(
        "change",
        async () => {

            state.abrangencia =
                $("abrangencia").value;


            clearMunicipio();

            updateMetricOptions();


            $("uf").disabled =
                state.abrangencia ===
                "ufs";


            if (
                state.abrangencia ===
                "municipios"
            ) {

                await loadRegion(
                    $("uf").value
                );
            }


            updateAll();
        }
    );


    $("uf").addEventListener(
        "change",
        async () => {

            await loadRegion(
                $("uf").value
            );


            updateAll();
        }
    );


    $("metrica").addEventListener(
        "change",
        () => {

            state.metrica =
                $("metrica").value;


            updateMap();

            updateRanking();
        }
    );


    $("classificacao").addEventListener(
        "change",
        () => {

            state.classificacao =
                $("classificacao").value;


            updateMap();
        }
    );


    $("ano").addEventListener(
        "change",
        () => {

            setYear(
                Number(
                    $("ano").value
                )
            );
        }
    );


    $("slider").addEventListener(
        "input",
        () => {

            setYear(
                state.meta.anos[
                    Number(
                        $("slider").value
                    )
                ]
            );
        }
    );


    $("prev").addEventListener(
        "click",
        () =>
            moveYear(-1)
    );


    $("next").addEventListener(
        "click",
        () =>
            moveYear(1)
    );


    $("play").addEventListener(
        "click",
        playPause
    );


    $("clear-municipio").addEventListener(
        "click",
        () => {

            clearMunicipio();

            updateContext();

            updateProfile();

            updateLine();

            updateRanking();
        }
    );


    document
        .querySelectorAll(
            ".period"
        )
        .forEach(
            b => {

                b.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".period"
                            )
                            .forEach(
                                x =>
                                    x.classList.remove(
                                        "active"
                                    )
                            );


                        b.classList.add(
                            "active"
                        );


                        state.linha =
                            b.dataset.period;


                        updateLine();
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".side-tab"
        )
        .forEach(
            b => {

                b.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".side-tab"
                            )
                            .forEach(
                                x =>
                                    x.classList.remove(
                                        "active"
                                    )
                            );


                        b.classList.add(
                            "active"
                        );


                        state.sidebar =
                            b.dataset.side;


                        $("side-perfil")
                            .classList
                            .toggle(
                                "hidden",
                                state.sidebar !==
                                "perfil"
                            );


                        $("side-ranking")
                            .classList
                            .toggle(
                                "hidden",
                                state.sidebar !==
                                "ranking"
                            );


                        if (
                            state.sidebar ===
                            "ranking"
                        ) {

                            updateRanking();

                        } else {

                            updateProfile();
                        }
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".tab"
        )
        .forEach(
            b => {

                b.addEventListener(
                    "click",
                    () =>
                        activateTab(
                            b.dataset.tab
                        )
                );
            }
        );
}


function activateTab(name) {

    document
        .querySelectorAll(
            ".tab"
        )
        .forEach(
            b =>
                b.classList.toggle(
                    "active",
                    b.dataset.tab === name
                )
        );


    document
        .querySelectorAll(
            ".tab-content"
        )
        .forEach(
            x =>
                x.classList.remove(
                    "active"
                )
        );


    $(
        `tab-${name}`
    )
    .classList
    .add(
        "active"
    );


    if (
        name ===
        "geral"
    ) {

        setTimeout(
            () => {

                Plotly.Plots.resize(
                    $("mapa")
                );


                Plotly.Plots.resize(
                    $("linha")
                );

            },
            60
        );
    }
}


function updateMetricOptions() {

    const sel =
        $("metrica");


    const previous =
        state.metrica;


    if (
        state.abrangencia ===
        "municipios"
    ) {

        const disabled =
            state.tipo === 0
            ?
            " disabled"
            :
            "";


        sel.innerHTML =

            '<option value="alertas">Número de alertas</option>'

            +

            '<option value="participacao"'
            +
            disabled
            +
            '>Participação do tipo no total do município (%)</option>';


        state.metrica =
            [
                "alertas",
                "participacao"
            ]
            .includes(
                previous
            )
            ?
            previous
            :
            "alertas";


        if (
            state.tipo === 0
            &&
            state.metrica ===
            "participacao"
        ) {

            state.metrica =
                "alertas";
        }

    } else {

        sel.innerHTML =

            '<option value="alertas">Número de alertas</option>'

            +

            '<option value="municipios">Municípios abrangidos</option>'

            +

            '<option value="cobertura">Cobertura municipal (%)</option>';


        state.metrica =
            [
                "alertas",
                "municipios",
                "cobertura"
            ]
            .includes(
                previous
            )
            ?
            previous
            :
            "alertas";
    }


    sel.value =
        state.metrica;
}


async function loadRegion(region) {

    state.region =
        region;


    clearMunicipio();


    $("uf").value =
        region;


    if (
        state.abrangencia !==
        "municipios"
    ) {

        updateContext();

        return;
    }


    mapLoading(true);


    try {

        if (
            state.munCache[
                region
            ]
        ) {

            state.geoMun =
                state.munCache[
                    region
                ].geo;


            state.munA =
                state.munCache[
                    region
                ].anual;

        } else {

            const [
                geo,
                anual
            ] =
            await Promise.all([

                loadJSON(
                    `geo/municipios/${region}.geojson`
                ),

                loadJSON(
                    `data/municipios/${region}_anual.json`
                )

            ]);


            state.munCache[
                region
            ] = {

                geo,
                anual,
                mensal:null
            };


            state.geoMun =
                geo;


            state.munA =
                anual;
        }


        updateContext();

    }

    finally {

        mapLoading(false);
    }
}


function clearMunicipio() {

    state.selectedMunicipio =
        null;
}


function updateContext() {

    $("context-region").textContent =
        state.abrangencia ===
        "ufs"
        ?
        "Brasil — UFs"
        :
        (
            state.region === "BR"
            ?
            "Brasil — municípios"
            :
            `${state.region} — municípios`
        );


    const has =
        Boolean(
            state.selectedMunicipio
        );


    $("context-municipio-wrap")
        .classList
        .toggle(
            "hidden",
            !has
        );


    $("clear-municipio")
        .classList
        .toggle(
            "hidden",
            !has
        );


    if (
        has
    ) {

        $("context-municipio").textContent =
            `${state.selectedMunicipio.nome} (${state.selectedMunicipio.uf})`;
    }
}


function setYear(ano) {

    state.ano =
        ano;


    $("ano").value =
        ano;


    $("slider").value =
        state.meta.anos.indexOf(
            ano
        );


    updateSliderLabel();

    updateCards();

    updateMap();

    updateProfile();

    updateRanking();
}


function updateSliderLabel() {

    $("slider-label").textContent =
        state.ano === 2026
        ?
        "2026*"
        :
        state.ano;
}


function moveYear(delta) {

    let i =
        state.meta.anos.indexOf(
            state.ano
        )
        +
        delta;


    if (
        i < 0
    ) {

        i =
            state.meta.anos.length - 1;
    }


    if (
        i >=
        state.meta.anos.length
    ) {

        i =
            0;
    }


    setYear(
        state.meta.anos[
            i
        ]
    );
}


function playPause() {

    if (
        state.playing
    ) {

        stopPlay();

        return;
    }


    state.playing =
        true;


    $("play").textContent =
        "❚❚ Pausar";


    state.timer =
        setInterval(
            () =>
                moveYear(1),
            1250
        );
}


function stopPlay() {

    state.playing =
        false;


    $("play").textContent =
        "▶ Reproduzir";


    if (
        state.timer
    ) {

        clearInterval(
            state.timer
        );


        state.timer =
            null;
    }
}


function brasilAno(
    ano,
    forma,
    tipo
) {

    const r =
        state.brA.find(
            x =>
                x[0] === ano
                &&
                x[1] === forma
                &&
                x[2] === tipo
        );


    return r
        ?
        r[3]
        :
        0;
}


function ufAno(
    ano,
    uf,
    forma,
    tipo
) {

    const r =
        state.ufA.find(
            x =>
                x[0] === ano
                &&
                x[1] === uf
                &&
                x[2] === forma
                &&
                x[3] === tipo
        );


    return r
        ?
        {
            alertas:r[4],
            municipios:r[5]
        }
        :
        {
            alertas:0,
            municipios:0
        };
}


function totalMunicipiosByUF() {

    const out = {};


    state.geoBR.features.forEach(
        f => {

            const uf =
                f.properties.UF;


            out[uf] =
                (
                    out[uf]
                    ||
                    0
                )
                +
                1;
        }
    );


    return out;
}


function municipalityMetadata() {

    return state.geoMun.features.map(
        f => ({

            codigo:
                String(
                    f.properties.COD_IBGE
                )
                .padStart(
                    7,
                    "0"
                ),

            nome:
                f.properties.MUNICIPIO
                ||
                String(
                    f.properties.COD_IBGE
                ),

            uf:
                f.properties.UF

        })
    );
}


function aggregateMunicipalAnnual(
    ano
) {

    const selected =
        new Map();


    const denominator =
        new Map();


    state.munA.forEach(
        r => {

            if (
                r[0] !== ano
            ) {

                return;
            }


            if (
                state.forma !== 0
                &&
                r[1] !== state.forma
            ) {

                return;
            }


            const code =
                String(
                    r[3]
                )
                .padStart(
                    7,
                    "0"
                );


            denominator.set(

                code,

                (
                    denominator.get(
                        code
                    )
                    ||
                    0
                )
                +
                r[4]
            );


            if (
                state.tipo === 0
                ||
                r[2] === state.tipo
            ) {

                selected.set(

                    code,

                    (
                        selected.get(
                            code
                        )
                        ||
                        0
                    )
                    +
                    r[4]
                );
            }
        }
    );


    return {
        selected,
        denominator
    };
}


function buildMunicipalData(
    ano
) {

    const a =
        aggregateMunicipalAnnual(
            ano
        );


    return municipalityMetadata()
        .map(
            m => {

                const alertas =
                    a.selected.get(
                        m.codigo
                    )
                    ||
                    0;


                const total =
                    a.denominator.get(
                        m.codigo
                    )
                    ||
                    0;


                return {

                    ...m,

                    alertas,

                    total,

                    participacao:
                        total > 0
                        ?
                        alertas
                        /
                        total
                        *
                        100
                        :
                        0
                };
            }
        );
}


function buildUFData(
    ano
) {

    const totals =
        totalMunicipiosByUF();


    const ufs =
        Object.keys(
            totals
        )
        .sort();


    return ufs.map(
        uf => {

            const r =
                ufAno(
                    ano,
                    uf,
                    state.forma,
                    state.tipo
                );


            return {

                uf,

                alertas:
                    r.alertas,

                municipios:
                    r.municipios,

                totalMunicipios:
                    totals[uf],

                cobertura:
                    totals[uf] > 0
                    ?
                    r.municipios
                    /
                    totals[uf]
                    *
                    100
                    :
                    0
            };
        }
    );
}


function currentMapData() {

    return (
        state.abrangencia ===
        "municipios"
        ?
        buildMunicipalData(
            state.ano
        )
        :
        buildUFData(
            state.ano
        )
    );
}


function metricValue(d) {

    if (
        state.metrica ===
        "participacao"
    ) {

        return d.participacao;
    }


    if (
        state.metrica ===
        "municipios"
    ) {

        return d.municipios;
    }


    if (
        state.metrica ===
        "cobertura"
    ) {

        return d.cobertura;
    }


    return d.alertas;
}


function metricTitle() {

    return {

        alertas:
            "Número de alertas",

        participacao:
            "Participação do tipo no total do município (%)",

        municipios:
            "Municípios abrangidos",

        cobertura:
            "Cobertura municipal (%)"

    }[
        state.metrica
    ];
}


function quantile(
    sorted,
    p
) {

    if (
        !sorted.length
    ) {

        return 0;
    }


    const idx =
        Math.min(

            sorted.length - 1,

            Math.floor(
                (
                    sorted.length - 1
                )
                *
                p
            )
        );


    return sorted[
        idx
    ];
}


function quantileClassification(
    values
) {

    const pos =
        values

        .filter(
            v =>
                v > 0
                &&
                Number.isFinite(v)
        )

        .sort(
            (a,b) =>
                a - b
        );


    if (
        !pos.length
    ) {

        return {

            classes:
                values.map(
                    () => 0
                ),

            labels:[
                state.metrica === "cobertura"
                ||
                state.metrica === "participacao"
                ?
                "0%"
                :
                "Sem alertas"
            ],

            colors:[
                COLORS[0]
            ]
        };
    }


    const max =
        pos[
            pos.length - 1
        ];


    let thresholds =
        [
            .2,
            .4,
            .6,
            .8
        ]

        .map(
            p =>
                quantile(
                    pos,
                    p
                )
        )

        .filter(
            v =>
                v < max
        );


    thresholds =
        [
            ...new Set(
                thresholds
            )
        ]
        .sort(
            (a,b) =>
                a - b
        );


    const classes =
        values.map(
            v =>
                v <= 0
                ?
                0
                :
                1
                +
                thresholds
                .filter(
                    t =>
                        v > t
                )
                .length
        );


    const isPct =
        [
            "participacao",
            "cobertura"
        ]
        .includes(
            state.metrica
        );


    const f =
        v =>
            isPct
            ?
            `${fmt1.format(v)}%`
            :
            fmtInt.format(v);


    const labels = [

        isPct
        ?
        "0%"
        :
        "Sem alertas"

    ];


    if (
        !thresholds.length
    ) {

        labels.push(
            f(max)
        );

    } else {

        labels.push(
            `≤ ${f(thresholds[0])}`
        );


        for (
            let i = 1;
            i < thresholds.length;
            i++
        ) {

            labels.push(
                `${f(thresholds[i-1])} – ${f(thresholds[i])}`
            );
        }


        labels.push(
            `> ${f(thresholds[thresholds.length - 1])}`
        );
    }


    const colors =
        Array.from(
            {
                length:
                    labels.length
            },
            (_,i) =>
                COLORS[
                    Math.min(
                        i,
                        COLORS.length - 1
                    )
                ]
        );


    return {
        classes,
        labels,
        colors
    };
}


function steppedScale(
    colors
) {

    const n =
        colors.length;


    const out = [];


    colors.forEach(
        (c,i) => {

            const lo =
                i / n;


            const hi =
                (
                    i + 1
                )
                /
                n;


            out.push(
                [
                    lo,
                    c
                ],

                [
                    Math.max(
                        lo,
                        hi - 0.000001
                    ),
                    c
                ]
            );
        }
    );


    return out;
}


function fixedMax() {

    if (
        [
            "participacao",
            "cobertura"
        ]
        .includes(
            state.metrica
        )
    ) {

        return 100;
    }


    let max =
        1;


    state.meta.anos.forEach(
        ano => {

            const arr =
                state.abrangencia ===
                "municipios"
                ?
                buildMunicipalData(
                    ano
                )
                :
                buildUFData(
                    ano
                );


            arr.forEach(
                d => {

                    max =
                        Math.max(
                            max,
                            metricValue(d)
                        );
                }
            );
        }
    );


    return max;
}


function updateMap() {

    const data =
        currentMapData();


    const values =
        data.map(
            metricValue
        );


    const title =
        metricTitle();


    let trace;


    if (
        state.classificacao ===
        "quantis"
    ) {

        const q =
            quantileClassification(
                values
            );


        const n =
            q.labels.length;


        trace = {

            type:
                "choropleth",

            geojson:
                state.abrangencia ===
                "municipios"
                ?
                state.geoMun
                :
                state.geoUF,

            featureidkey:
                state.abrangencia ===
                "municipios"
                ?
                "properties.COD_IBGE"
                :
                "properties.UF",

            locations:
                data.map(
                    d =>
                        state.abrangencia ===
                        "municipios"
                        ?
                        d.codigo
                        :
                        d.uf
                ),

            z:
                q.classes,

            zmin:
                -0.5,

            zmax:
                n - 0.5,

            colorscale:
                steppedScale(
                    q.colors
                ),

            marker:{

                line:{

                    color:
                        "#59636c",

                    width:
                        state.abrangencia ===
                        "municipios"
                        ?
                        (
                            state.region === "BR"
                            ?
                            0.10
                            :
                            0.38
                        )
                        :
                        0.8
                }
            },

            colorbar:{

                title:
                    title,

                thickness:
                    15,

                len:
                    .68,

                tickmode:
                    "array",

                tickvals:
                    q.labels.map(
                        (_,i) =>
                            i
                    ),

                ticktext:
                    q.labels
            },

            customdata:
                state.abrangencia ===
                "municipios"
                ?
                data.map(
                    d => [

                        d.nome,
                        d.uf,
                        d.alertas,
                        d.total,
                        d.participacao

                    ]
                )
                :
                data.map(
                    d => [

                        d.uf,
                        d.alertas,
                        d.municipios,
                        d.totalMunicipios,
                        d.cobertura

                    ]
                ),

            hovertemplate:
                state.abrangencia ===
                "municipios"
                ?

                "<b>%{customdata[0]} (%{customdata[1]})</b><br>"
                +
                "Alertas do tipo: %{customdata[2]:,.0f}<br>"
                +
                "Total de alertas do município: %{customdata[3]:,.0f}<br>"
                +
                "Participação do tipo: %{customdata[4]:.2f}%"
                +
                "<extra></extra>"

                :

                "<b>%{customdata[0]}</b><br>"
                +
                "Alertas: %{customdata[1]:,.0f}<br>"
                +
                "Municípios abrangidos: %{customdata[2]:,.0f} de %{customdata[3]:,.0f}<br>"
                +
                "Cobertura municipal: %{customdata[4]:.1f}%"
                +
                "<extra></extra>"
        };

    } else {

        trace = {

            type:
                "choropleth",

            geojson:
                state.abrangencia ===
                "municipios"
                ?
                state.geoMun
                :
                state.geoUF,

            featureidkey:
                state.abrangencia ===
                "municipios"
                ?
                "properties.COD_IBGE"
                :
                "properties.UF",

            locations:
                data.map(
                    d =>
                        state.abrangencia ===
                        "municipios"
                        ?
                        d.codigo
                        :
                        d.uf
                ),

            z:
                values,

            zmin:
                0,

            zmax:
                fixedMax(),

            colorscale:[

                [0,"#f1f5f7"],
                [.2,"#d7e6ee"],
                [.4,"#9fc4d8"],
                [.6,"#649dbb"],
                [.8,"#326f94"],
                [1,"#174765"]

            ],

            marker:{

                line:{

                    color:
                        "#59636c",

                    width:
                        state.abrangencia ===
                        "municipios"
                        ?
                        (
                            state.region === "BR"
                            ?
                            0.10
                            :
                            0.38
                        )
                        :
                        0.8
                }
            },

            colorbar:{

                title:
                    title,

                thickness:
                    15,

                len:
                    .68
            },

            customdata:
                state.abrangencia ===
                "municipios"
                ?
                data.map(
                    d => [

                        d.nome,
                        d.uf,
                        d.alertas,
                        d.total,
                        d.participacao

                    ]
                )
                :
                data.map(
                    d => [

                        d.uf,
                        d.alertas,
                        d.municipios,
                        d.totalMunicipios,
                        d.cobertura

                    ]
                ),

            hovertemplate:
                state.abrangencia ===
                "municipios"
                ?

                "<b>%{customdata[0]} (%{customdata[1]})</b><br>"
                +
                "Alertas do tipo: %{customdata[2]:,.0f}<br>"
                +
                "Total de alertas do município: %{customdata[3]:,.0f}<br>"
                +
                "Participação do tipo: %{customdata[4]:.2f}%"
                +
                "<extra></extra>"

                :

                "<b>%{customdata[0]}</b><br>"
                +
                "Alertas: %{customdata[1]:,.0f}<br>"
                +
                "Municípios abrangidos: %{customdata[2]:,.0f} de %{customdata[3]:,.0f}<br>"
                +
                "Cobertura municipal: %{customdata[4]:.1f}%"
                +
                "<extra></extra>"
        };
    }


    const territory =
        state.abrangencia ===
        "ufs"
        ?
        "Brasil — 27 UFs"
        :
        (
            state.region === "BR"
            ?
            "Brasil — 5.570 municípios"
            :
            `${state.region} — municípios`
        );


    const layout = {

        title:{

            text:

                `<b>${state.meta.tipos[state.tipo]}</b>`

                +

                `<br><sup>`

                +

                `${title}`

                +

                ` | ${state.meta.formas[state.forma]}`

                +

                ` | ${territory}`

                +

                ` | ${state.ano === 2026 ? "2026*" : state.ano}`

                +

                `</sup>`,

            x:.02
        },

        geo:{

            fitbounds:
                "locations",

            visible:
                false,

            bgcolor:
                "white"
        },

        margin:{

            l:4,
            r:82,
            t:76,
            b:4
        },

        paper_bgcolor:
            "white"
    };


    Plotly.react(

        "mapa",

        [
            trace
        ],

        layout,

        {

            responsive:true,
            displaylogo:false
        }

    ).then(
        () => {

            const gd =
                $("mapa");


            if (
                !gd._territorialClick
            ) {

                gd.on(
                    "plotly_click",
                    ev => {

                        if (
                            !ev.points
                            ||
                            !ev.points.length
                        ) {

                            return;
                        }


                        if (
                            state.abrangencia ===
                            "municipios"
                        ) {

                            const p =
                                ev.points[0];


                            selectMunicipio({

                                codigo:
                                    String(
                                        p.location
                                    )
                                    .padStart(
                                        7,
                                        "0"
                                    ),

                                nome:
                                    p.customdata[0],

                                uf:
                                    p.customdata[1]

                            });

                        } else {

                            const uf =
                                String(
                                    ev.points[0].location
                                );


                            $("abrangencia").value =
                                "municipios";


                            state.abrangencia =
                                "municipios";


                            $("uf").disabled =
                                false;


                            $("uf").value =
                                uf;


                            updateMetricOptions();


                            loadRegion(
                                uf
                            )
                            .then(
                                () =>
                                    updateAll()
                            );
                        }
                    }
                );


                gd._territorialClick =
                    true;
            }
        }
    );


    $("map-note").textContent =

        (
            state.ano === 2026
            ?
            `2026 parcial até ${formatDate(state.meta.periodo_final)}. `
            :
            ""
        )

        +

        (
            state.classificacao ===
            "quantis"
            ?
            "Quantis: valores zero ficam separados e os valores positivos são distribuídos em até cinco classes. "
            :
            "Escala fixa: mantém a mesma referência entre os anos. "
        )

        +

        (
            state.metrica ===
            "participacao"
            ?
            "A participação mede composição, não volume: 1 de 1 e 23 de 23 são ambos 100%. O tooltip mostra sempre o total absoluto."
            :
            ""
        );
}


function updateCards() {

    const totalMun =
        state.geoBR.features.length;


    if (
        state.abrangencia ===
        "ufs"
    ) {

        const d =
            buildUFData(
                state.ano
            );


        const active =
            d.filter(
                x =>
                    x.alertas > 0
            );


        const munReached =
            d.reduce(
                (s,x) =>
                    s + x.municipios,
                0
            );


        const cov =
            munReached
            /
            totalMun
            *
            100;


        const top =
            [
                ...d
            ]
            .sort(
                (a,b) =>
                    b.alertas
                    -
                    a.alertas
            )[0];


        $("card-alertas").textContent =
            fmtInt.format(
                brasilAno(
                    state.ano,
                    state.forma,
                    state.tipo
                )
            );


        $("card-alertas-sub").textContent =
            "alertas enviados no Brasil";


        $("card-municipios").textContent =
            `${fmtInt.format(munReached)} de ${fmtInt.format(totalMun)}`;


        $("card-municipios-sub").textContent =
            "municípios abrangidos";


        $("card-cobertura").textContent =
            `${fmt1.format(cov)}%`;


        $("card-cobertura-sub").textContent =
            "cobertura municipal nacional";


        $("card-territorio-label").textContent =
            "UFs abrangidas";


        $("card-territorio").textContent =
            `${active.length} de 27`;


        $("card-territorio-sub").textContent =
            "com alertas na seleção";


        $("card-top-label").textContent =
            "UF com mais alertas";


        $("card-top").textContent =
            top
            ?
            top.uf
            :
            "—";


        $("card-top-sub").textContent =
            top
            ?
            `${fmtInt.format(top.alertas)} alertas · ${fmt1.format(top.cobertura)}% de cobertura`
            :
            "—";

    } else {

        const d =
            buildMunicipalData(
                state.ano
            );


        const active =
            d.filter(
                x =>
                    x.alertas > 0
            );


        const total =
            d.length;


        const cov =
            total
            ?
            active.length
            /
            total
            *
            100
            :
            0;


        const totalAlerts =
            state.region === "BR"
            ?
            brasilAno(
                state.ano,
                state.forma,
                state.tipo
            )
            :
            ufAno(
                state.ano,
                state.region,
                state.forma,
                state.tipo
            ).alertas;


        const top =
            [
                ...d
            ]
            .sort(
                (a,b) =>
                    b.alertas
                    -
                    a.alertas
            )[0];


        $("card-alertas").textContent =
            fmtInt.format(
                totalAlerts
            );


        $("card-alertas-sub").textContent =
            state.region === "BR"
            ?
            "alertas enviados no Brasil"
            :
            `alertas associados a ${state.region}`;


        $("card-municipios").textContent =
            `${fmtInt.format(active.length)} de ${fmtInt.format(total)}`;


        $("card-municipios-sub").textContent =
            state.region === "BR"
            ?
            "municípios brasileiros"
            :
            `municípios de ${state.region}`;


        $("card-cobertura").textContent =
            `${fmt1.format(cov)}%`;


        $("card-cobertura-sub").textContent =
            "cobertura municipal do recorte";


        if (
            state.region === "BR"
        ) {

            const ufs =
                new Set(
                    active.map(
                        x =>
                            x.uf
                    )
                );


            $("card-territorio-label").textContent =
                "UFs abrangidas";


            $("card-territorio").textContent =
                `${ufs.size} de 27`;


            $("card-territorio-sub").textContent =
                "com município na seleção";

        } else {

            const br =
                brasilAno(
                    state.ano,
                    state.forma,
                    state.tipo
                );


            const pct =
                br
                ?
                totalAlerts
                /
                br
                *
                100
                :
                0;


            $("card-territorio-label").textContent =
                "Participação no Brasil";


            $("card-territorio").textContent =
                `${fmt2.format(pct)}%`;


            $("card-territorio-sub").textContent =
                "dos alertas da seleção";
        }


        $("card-top-label").textContent =
            "Município com mais alertas";


        $("card-top").textContent =
            top
            &&
            top.alertas > 0
            ?
            top.nome
            :
            "—";


        $("card-top-sub").textContent =
            top
            &&
            top.alertas > 0
            ?
            `${top.uf} · ${fmtInt.format(top.alertas)} alertas`
            :
            "sem alertas";
    }


    updateVariation();
}


function currentTerritorialTotal(
    ano
) {

    if (
        state.abrangencia ===
        "ufs"
        ||
        state.region ===
        "BR"
    ) {

        return brasilAno(
            ano,
            state.forma,
            state.tipo
        );
    }


    return ufAno(
        ano,
        state.region,
        state.forma,
        state.tipo
    ).alertas;
}


function updateVariation() {

    const n =
        $("card-variacao");


    n.classList.remove(
        "positive",
        "negative"
    );


    if (
        state.ano ===
        state.meta.anos[0]
    ) {

        n.textContent =
            "—";


        $("card-variacao-sub").textContent =
            "sem ano anterior";


        return;
    }


    let atual;
    let ant;
    let leg;


    if (
        state.ano ===
        2026
    ) {

        atual =
            sumMonthlyTerritorial(
                2026,
                1,
                7
            );


        ant =
            sumMonthlyTerritorial(
                2025,
                1,
                7
            );


        leg =
            "jan–jul/2026 vs jan–jul/2025";

    } else {

        atual =
            currentTerritorialTotal(
                state.ano
            );


        ant =
            currentTerritorialTotal(
                state.ano - 1
            );


        leg =
            `${state.ano} vs ${state.ano - 1}`;
    }


    if (
        ant <= 0
    ) {

        n.textContent =
            "—";


        $("card-variacao-sub").textContent =
            leg;


        return;
    }


    const v =
        (
            atual
            /
            ant
            -
            1
        )
        *
        100;


    n.textContent =
        `${v > 0 ? "+" : ""}${fmt1.format(v)}%`;


    if (
        v > 0
    ) {

        n.classList.add(
            "positive"
        );

    } else if (
        v < 0
    ) {

        n.classList.add(
            "negative"
        );
    }


    $("card-variacao-sub").textContent =
        leg;
}


function sumMonthlyTerritorial(
    ano,
    m1,
    m2
) {

    let total =
        0;


    state.meta.meses.forEach(
        (txt,id) => {

            const [
                yy,
                mm
            ] =
            txt
            .split("-")
            .map(
                Number
            );


            if (
                yy !== ano
                ||
                mm < m1
                ||
                mm > m2
            ) {

                return;
            }


            if (
                state.abrangencia ===
                "ufs"
                ||
                state.region ===
                "BR"
            ) {

                const r =
                    state.brM.find(
                        x =>
                            x[0] === id
                            &&
                            x[1] === state.forma
                            &&
                            x[2] === state.tipo
                    );


                if (
                    r
                ) {

                    total +=
                        r[3];
                }

            } else {

                const r =
                    state.ufM.find(
                        x =>
                            x[0] === id
                            &&
                            x[1] === state.region
                            &&
                            x[2] === state.forma
                            &&
                            x[3] === state.tipo
                    );


                if (
                    r
                ) {

                    total +=
                        r[4];
                }
            }
        }
    );


    return total;
}


function selectMunicipio(m) {

    state.selectedMunicipio =
        m;


    updateContext();

    updateProfile();

    updateLine();

    updateRanking();
}


function updateRanking() {

    const box =
        $("ranking");


    if (
        state.abrangencia ===
        "ufs"
    ) {

        let d =
            buildUFData(
                state.ano
            );


        d.sort(
            (a,b) => {

                const va =
                    metricValue(a);


                const vb =
                    metricValue(b);


                return (
                    vb - va
                    ||
                    b.alertas - a.alertas
                );
            }
        );


        $("ranking-title").textContent =
            "Ranking das UFs";


        $("ranking-subtitle").textContent =
            state.metrica ===
            "cobertura"
            ?
            "Cobertura = municípios abrangidos ÷ total de municípios da UF."
            :
            "27 Unidades da Federação";


        box.innerHTML =

            '<table class="ranking-table">'

            +

            '<thead><tr>'

            +

            '<th>#</th>'

            +

            '<th>UF</th>'

            +

            '<th>Alertas</th>'

            +

            '<th>Mun.</th>'

            +

            '<th>Cob.</th>'

            +

            '</tr></thead><tbody>'

            +

            d.map(
                (x,i) => `

                    <tr>

                        <td>
                            ${i + 1}
                        </td>

                        <td>
                            <b>${x.uf}</b>
                        </td>

                        <td>
                            ${fmtInt.format(x.alertas)}
                        </td>

                        <td>
                            ${fmtInt.format(x.municipios)}
                        </td>

                        <td>
                            ${fmt1.format(x.cobertura)}%
                        </td>

                    </tr>

                `
            ).join("")

            +

            '</tbody></table>';

    } else {

        let d =
            buildMunicipalData(
                state.ano
            )
            .filter(
                x =>
                    x.alertas > 0
            );


        if (
            state.metrica ===
            "participacao"
        ) {

            d.sort(
                (a,b) =>

                    b.participacao
                    -
                    a.participacao

                    ||

                    b.alertas
                    -
                    a.alertas
            );

        } else {

            d.sort(
                (a,b) =>
                    b.alertas
                    -
                    a.alertas
            );
        }


        const display =
            state.region === "BR"
            ?
            d.slice(
                0,
                100
            )
            :
            d;


        $("ranking-title").textContent =
            "Ranking dos municípios";


        $("ranking-subtitle").textContent =
            state.metrica ===
            "participacao"
            ?
            "Ordenado pela participação; empates são desfeitos pelo número de alertas."
            :
            (
                state.region === "BR"
                ?
                "100 municípios com mais alertas"
                :
                "Municípios com alertas na seleção"
            );


        box.innerHTML =

            '<table class="ranking-table">'

            +

            '<thead><tr>'

            +

            '<th>#</th>'

            +

            '<th>Município</th>'

            +

            '<th>Tipo</th>'

            +

            '<th>Total</th>'

            +

            '<th>%</th>'

            +

            '</tr></thead><tbody>'

            +

            display.map(
                (x,i) => `

                    <tr
                        class="ranking-row ${
                            state.selectedMunicipio
                            &&
                            state.selectedMunicipio.codigo === x.codigo
                            ?
                            "selected"
                            :
                            ""
                        }"

                        data-code="${x.codigo}"

                        data-name="${escapeHTML(x.nome)}"

                        data-uf="${x.uf}"
                    >

                        <td>
                            ${i + 1}
                        </td>

                        <td>

                            <b>
                                ${escapeHTML(x.nome)}
                            </b>

                            <small>
                                ${x.uf}
                            </small>

                        </td>

                        <td>
                            ${fmtInt.format(x.alertas)}
                        </td>

                        <td>
                            ${fmtInt.format(x.total)}
                        </td>

                        <td>
                            ${fmt2.format(x.participacao)}%
                        </td>

                    </tr>
                `
            ).join("")

            +

            '</tbody></table>';


        box
            .querySelectorAll(
                ".ranking-row"
            )
            .forEach(
                r => {

                    r.addEventListener(
                        "click",
                        () => {

                            selectMunicipio({

                                codigo:
                                    r.dataset.code,

                                nome:
                                    r.dataset.name,

                                uf:
                                    r.dataset.uf

                            });
                        }
                    );
                }
            );
    }
}


function profileScope() {

    if (
        state.selectedMunicipio
    ) {

        return {

            level:
                "municipio",

            uf:
                state.selectedMunicipio.uf,

            code:
                state.selectedMunicipio.codigo,

            label:
                `${state.selectedMunicipio.nome} (${state.selectedMunicipio.uf})`
        };
    }


    if (
        state.abrangencia ===
        "municipios"
        &&
        state.region !==
        "BR"
    ) {

        return {

            level:
                "uf",

            uf:
                state.region,

            label:
                state.region
        };
    }


    return {

        level:
            "brasil",

        label:
            "Brasil"
    };
}


async function getProfileRows() {

    const scope =
        profileScope();


    if (
        scope.level ===
        "brasil"
    ) {

        return {

            rows:
                state.profileBR,

            scope
        };
    }


    if (
        scope.level ===
        "uf"
    ) {

        return {

            rows:
                state.profileUF,

            scope
        };
    }


    if (
        !state.profileMunCache[
            scope.uf
        ]
    ) {

        profileLoading(true);


        try {

            state.profileMunCache[
                scope.uf
            ] =
                await loadJSON(
                    `data/perfil/municipios/${scope.uf}_anual.json`
                );

        }

        finally {

            profileLoading(false);
        }
    }


    return {

        rows:
            state.profileMunCache[
                scope.uf
            ],

        scope
    };
}


function indicatorCategories(
    indicatorId
) {

    const obj =
        state.profileMeta.indicadores.find(
            x =>
                x.id === indicatorId
        );


    return obj
        ?
        obj.categorias
        :
        [];
}


async function indicatorDistribution(
    indicatorId
) {

    const {
        rows,
        scope
    } =
    await getProfileRows();


    const sums =
        new Map();


    rows.forEach(
        r => {

            let ok =
                false;


            let categoryId;
            let count;


            if (
                scope.level ===
                "brasil"
            ) {

                ok =
                    r[0] === state.ano

                    &&

                    (
                        state.forma === 0
                        ||
                        r[1] === state.forma
                    )

                    &&

                    (
                        state.tipo === 0
                        ||
                        r[2] === state.tipo
                    )

                    &&

                    r[3] === indicatorId;


                categoryId =
                    r[4];


                count =
                    r[5];

            } else if (
                scope.level ===
                "uf"
            ) {

                ok =
                    r[0] === state.ano

                    &&

                    r[1] === scope.uf

                    &&

                    (
                        state.forma === 0
                        ||
                        r[2] === state.forma
                    )

                    &&

                    (
                        state.tipo === 0
                        ||
                        r[3] === state.tipo
                    )

                    &&

                    r[4] === indicatorId;


                categoryId =
                    r[5];


                count =
                    r[6];

            } else {

                ok =
                    r[0] === state.ano

                    &&

                    String(
                        r[3]
                    )
                    .padStart(
                        7,
                        "0"
                    )
                    ===
                    scope.code

                    &&

                    (
                        state.forma === 0
                        ||
                        r[1] === state.forma
                    )

                    &&

                    (
                        state.tipo === 0
                        ||
                        r[2] === state.tipo
                    )

                    &&

                    r[4] === indicatorId;


                categoryId =
                    r[5];


                count =
                    r[6];
            }


            if (
                ok
            ) {

                sums.set(

                    categoryId,

                    (
                        sums.get(
                            categoryId
                        )
                        ||
                        0
                    )
                    +
                    count
                );
            }
        }
    );


    const cats =
        indicatorCategories(
            indicatorId
        );


    return [

        ...sums.entries()

    ]

    .map(
        ([id,value]) => ({

            name:
                trCategory(
                    cats[id]
                    ??
                    String(id)
                ),

            value
        })
    )

    .filter(
        x =>
            x.value > 0
    )

    .sort(
        (a,b) =>
            b.value
            -
            a.value
    );
}


function donut(
    divId,
    title,
    data,
    footer=""
) {

    const total =
        data.reduce(
            (s,x) =>
                s + x.value,
            0
        );


    Plotly.react(

        divId,

        [
            {

                type:
                    "pie",

                labels:
                    data.map(
                        x =>
                            x.name
                    ),

                values:
                    data.map(
                        x =>
                            x.value
                    ),

                hole:
                    .62,

                domain:{

                    x:[
                        .08,
                        .92
                    ],

                    y:[
                        .43,
                        .98
                    ]
                },

                sort:
                    false,

                textinfo:
                    "none",

                hovertemplate:
                    "<b>%{label}</b><br>%{value:,.0f} (%{percent})<extra></extra>"
            }
        ],

        {

            title:{

                text:
                    `<b>${title}</b>`,

                x:.03,

                font:{
                    size:11
                }
            },

            margin:{

                l:4,
                r:4,
                t:30,
                b:4
            },

            height:
                150,

            showlegend:
                true,

            legend:{

                orientation:
                    "h",

                x:
                    .5,

                xanchor:
                    "center",

                y:
                    .02,

                yanchor:
                    "bottom",

                font:{

                    size:
                        7
                },

                traceorder:
                    "normal"
            },

            annotations:[
                {

                    text:
                        fmtInt.format(
                            total
                        ),

                    x:
                        .5,

                    y:
                        .70,

                    showarrow:
                        false,

                    font:{
                        size:12
                    }
                }
            ],

            paper_bgcolor:
                "white"
        },

        {

            responsive:true,
            displaylogo:false
        }
    );


    if (
        footer
    ) {

        $(
            divId
            +
            "-note"
        ).textContent =
            footer;
    }
}


function horizontalBars(
    divId,
    title,
    data,
    height=170
) {

    const rev =
        [
            ...data
        ]
        .reverse();


    Plotly.react(

        divId,

        [
            {

                type:
                    "bar",

                orientation:
                    "h",

                y:
                    rev.map(
                        x =>
                            x.name
                    ),

                x:
                    rev.map(
                        x =>
                            x.value
                    ),

                hovertemplate:
                    "<b>%{y}</b><br>%{x:,.0f}<extra></extra>"
            }
        ],

        {

            title:{

                text:
                    `<b>${title}</b>`,

                x:.03,

                font:{
                    size:11
                }
            },

            margin:{

                l:105,
                r:10,
                t:30,
                b:20
            },

            height,

            paper_bgcolor:
                "white",

            plot_bgcolor:
                "white",

            xaxis:{

                showgrid:
                    true,

                gridcolor:
                    "rgba(100,110,120,.10)"
            },

            yaxis:{

                tickfont:{
                    size:8
                }
            }
        },

        {

            responsive:true,
            displaylogo:false
        }
    );
}


function typeDistribution() {

    const sums =
        new Map();


    const scope =
        profileScope();


    if (
        scope.level ===
        "brasil"
    ) {

        state.brA.forEach(
            r => {

                if (
                    r[0] === state.ano
                    &&
                    r[1] === state.forma
                    &&
                    r[2] > 0
                ) {

                    sums.set(
                        r[2],
                        r[3]
                    );
                }
            }
        );

    } else if (
        scope.level ===
        "uf"
    ) {

        state.ufA.forEach(
            r => {

                if (
                    r[0] === state.ano
                    &&
                    r[1] === scope.uf
                    &&
                    r[2] === state.forma
                    &&
                    r[3] > 0
                ) {

                    sums.set(
                        r[3],
                        r[4]
                    );
                }
            }
        );

    } else {

        state.munA.forEach(
            r => {

                if (
                    r[0] !== state.ano
                    ||
                    String(
                        r[3]
                    )
                    .padStart(
                        7,
                        "0"
                    )
                    !==
                    scope.code
                ) {

                    return;
                }


                if (
                    state.forma !== 0
                    &&
                    r[1] !== state.forma
                ) {

                    return;
                }


                sums.set(

                    r[2],

                    (
                        sums.get(
                            r[2]
                        )
                        ||
                        0
                    )
                    +
                    r[4]
                );
            }
        );
    }


    let arr = [

        ...sums.entries()

    ]

    .map(
        ([id,value]) => ({

            name:
                state.meta.tipos[id]
                ||
                String(id),

            value
        })
    )

    .filter(
        x =>
            x.value > 0
    )

    .sort(
        (a,b) =>
            b.value
            -
            a.value
    );


    if (
        arr.length > 8
    ) {

        const rest =
            arr
            .slice(
                8
            )
            .reduce(
                (s,x) =>
                    s + x.value,
                0
            );


        arr =
            arr.slice(
                0,
                8
            );


        if (
            rest > 0
        ) {

            arr.push({

                name:
                    "OUTROS",

                value:
                    rest
            });
        }
    }


    return arr;
}



async function updateProfile() {




    profileLoading(true);


    try {

        const [
            sev,
            urg,
            prob,
            acao,
            periodo
        ] =
        await Promise.all(

            [
                0,
                1,
                2,
                3,
                4
            ]
            .map(
                indicatorDistribution
            )
        );


        const scope =
            profileScope();


        $("profile-scope").textContent =

            `${scope.label}`

            +

            ` · ${state.ano === 2026 ? "2026*" : state.ano}`

            +

            ` · ${state.meta.formas[state.forma]}`

            +

            ` · ${state.meta.tipos[state.tipo]}`;


        donut(
            "pie-severidade",
            "Severidade",
            sev
        );


        donut(
            "pie-urgencia",
            "Urgência",
            urg
        );


        donut(
            "pie-probabilidade",
            "Probabilidade",
            prob
        );


        donut(

            "pie-periodo",

            "Período do dia",

            periodo,

            scope.level ===
            "brasil"
            ?
            "Brasil: apenas alertas territorializados."
            :
            ""
        );


        horizontalBars(
            "bar-acao",
            "Ação necessária",
            acao,
            170
        );


        horizontalBars(
            "bar-tipos",
            "Tipos de desastre",
            typeDistribution(),
            220
        );

    }

    finally {

        profileLoading(false);
    }
}


async function loadMunicipalMonthly(
    uf
) {

    if (
        !state.munCache[
            uf
        ]
    ) {

        state.munCache[
            uf
        ] = {

            geo:null,
            anual:null,
            mensal:null
        };
    }


    if (
        state.munCache[
            uf
        ].mensal
    ) {

        return state.munCache[
            uf
        ].mensal;
    }


    state.munCache[
        uf
    ].mensal =
        await loadJSON(
            `data/municipios/${uf}_mensal.json`
        );


    return state.munCache[
        uf
    ].mensal;
}


function updateLine() {

    if (
        state.selectedMunicipio
    ) {

        if (
            state.linha ===
            "mensal"
        ) {

            drawMunicipalMonthly();

        } else {

            drawMunicipalAnnual();
        }

    } else if (
        state.linha ===
        "mensal"
    ) {

        drawTerritorialMonthly();

    } else {

        drawTerritorialAnnual();
    }
}


function drawTerritorialAnnual() {

    const x =
        state.meta.anos;


    const y =
        x.map(
            ano =>

                state.abrangencia ===
                "ufs"

                ||

                state.region ===
                "BR"

                ?

                brasilAno(
                    ano,
                    state.forma,
                    state.tipo
                )

                :

                ufAno(
                    ano,
                    state.region,
                    state.forma,
                    state.tipo
                ).alertas
        );


    drawLine(

        x,
        y,
        false,

        state.abrangencia ===
        "ufs"
        ?
        "Brasil"
        :
        (
            state.region ===
            "BR"
            ?
            "Brasil"
            :
            state.region
        )
    );
}


function drawTerritorialMonthly() {

    const x =
        state.meta.meses.map(
            m =>
                `${m}-01`
        );


    const y =
        new Array(
            x.length
        )
        .fill(0);


    if (
        state.abrangencia ===
        "ufs"
        ||
        state.region ===
        "BR"
    ) {

        state.brM.forEach(
            r => {

                if (
                    r[1] === state.forma
                    &&
                    r[2] === state.tipo
                ) {

                    y[
                        r[0]
                    ] =
                        r[3];
                }
            }
        );

    } else {

        state.ufM.forEach(
            r => {

                if (
                    r[1] === state.region
                    &&
                    r[2] === state.forma
                    &&
                    r[3] === state.tipo
                ) {

                    y[
                        r[0]
                    ] =
                        r[4];
                }
            }
        );
    }


    drawLine(

        x,
        y,
        true,

        state.abrangencia ===
        "ufs"
        ?
        "Brasil"
        :
        (
            state.region ===
            "BR"
            ?
            "Brasil"
            :
            state.region
        )
    );
}


function drawMunicipalAnnual() {

    const code =
        state.selectedMunicipio.codigo;


    const x =
        state.meta.anos;


    const y =
        x.map(
            ano => {

                let t =
                    0;


                state.munA.forEach(
                    r => {

                        if (
                            r[0] === ano

                            &&

                            String(
                                r[3]
                            )
                            .padStart(
                                7,
                                "0"
                            )
                            ===
                            code

                            &&

                            (
                                state.forma === 0
                                ||
                                r[1] === state.forma
                            )

                            &&

                            (
                                state.tipo === 0
                                ||
                                r[2] === state.tipo
                            )
                        ) {

                            t +=
                                r[4];
                        }
                    }
                );


                return t;
            }
        );


    drawLine(

        x,
        y,
        false,

        `${state.selectedMunicipio.nome} (${state.selectedMunicipio.uf})`
    );
}


async function drawMunicipalMonthly() {

    const m =
        state.selectedMunicipio;


    const rows =
        await loadMunicipalMonthly(
            m.uf
        );


    const x =
        state.meta.meses.map(
            s =>
                `${s}-01`
        );


    const y =
        new Array(
            x.length
        )
        .fill(0);


    rows.forEach(
        r => {

            if (
                String(
                    r[3]
                )
                .padStart(
                    7,
                    "0"
                )
                ===
                m.codigo

                &&

                (
                    state.forma === 0
                    ||
                    r[1] === state.forma
                )

                &&

                (
                    state.tipo === 0
                    ||
                    r[2] === state.tipo
                )
            ) {

                y[
                    r[0]
                ] +=
                    r[4];
            }
        }
    );


    drawLine(

        x,
        y,
        true,

        `${m.nome} (${m.uf})`
    );
}


function drawLine(
    x,
    y,
    mensal,
    label
) {

    Plotly.react(

        "linha",

        [
            {

                type:
                    "scatter",

                mode:
                    "lines",

                x,
                y,

                line:{

                    color:
                        "#286d95",

                    width:
                        2.3
                },

                fill:
                    "tozeroy",

                fillcolor:
                    "rgba(40,109,149,.08)",

                hovertemplate:
                    mensal
                    ?
                    "<b>%{x|%m/%Y}</b><br>%{y:,.0f} alertas<extra></extra>"
                    :
                    "<b>%{x}</b><br>%{y:,.0f} alertas<extra></extra>"
            }
        ],

        {

            title:{

                text:

                    `<b>${state.meta.tipos[state.tipo]}</b>`

                    +

                    `<br><sup>${label} | ${state.meta.formas[state.forma]}</sup>`,

                x:.01,

                font:{
                    size:13
                }
            },

            xaxis:{

                showgrid:
                    false
            },

            yaxis:{

                title:
                    "Alertas",

                rangemode:
                    "tozero",

                gridcolor:
                    "rgba(90,105,120,.12)"
            },

            margin:{

                l:55,
                r:15,
                t:55,
                b:35
            },

            height:
                285,

            hovermode:
                "x unified",

            paper_bgcolor:
                "white",

            plot_bgcolor:
                "white"
        },

        {

            responsive:true,
            displaylogo:false
        }
    );


    $("line-title").textContent =
        `Evolução dos alertas — ${label}`;


    $("line-note").textContent =
        state.meta.ultimo_mes_parcial
        ?
        `O último mês é parcial, com dados até ${formatDate(state.meta.periodo_final)}.`
        :
        "";
}


function updateAll() {

    updateContext();

    updateCards();

    updateMap();

    updateRanking();

    updateProfile();

    updateLine();
}


function formatDate(x) {

    const [
        y,
        m,
        d
    ] =
    x.split("-");


    return `${d}/${m}/${y}`;
}


function escapeHTML(v) {

    return String(v)

    .replaceAll(
        "&",
        "&amp;"
    )

    .replaceAll(
        "<",
        "&lt;"
    )

    .replaceAll(
        ">",
        "&gt;"
    )

    .replaceAll(
        '"',
        "&quot;"
    )

    .replaceAll(
        "'",
        "&#039;"
    );
}


init();



/* ===== INICIO LAYOUT JS 3 COLUNAS ===== */


function organizarPerfilTresColunas() {

    const mainGrid =
        document.querySelector(
            ".main-grid"
        );


    if (!mainGrid) {

        console.warn(
            "main-grid não encontrado."
        );

        return;
    }


    const mapPanel =
        mainGrid.querySelector(
            ".map-panel"
        );


    const sidebar =
        mainGrid.querySelector(
            ".sidebar"
        );


    if (
        !mapPanel
        ||
        !sidebar
    ) {

        console.warn(
            "Mapa ou sidebar não encontrados."
        );

        return;
    }


    /* ----------------------------------------------------------------------
       Evitar duplicação caso a função rode novamente
       ---------------------------------------------------------------------- */

    let leftPanel =
        mainGrid.querySelector(
            ".profile-left-panel"
        );


    if (!leftPanel) {

        leftPanel =
            document.createElement(
                "aside"
            );


        leftPanel.className =
            "panel profile-left-panel";


        mainGrid.insertBefore(
            leftPanel,
            mapPanel
        );
    }


    /* ----------------------------------------------------------------------
       A sidebar original vira a coluna direita
       ---------------------------------------------------------------------- */

    sidebar.classList.add(
        "profile-right-panel"
    );


    /* ----------------------------------------------------------------------
       Encontrar o perfil original
       ---------------------------------------------------------------------- */

    const sidePerfil =
        sidebar.querySelector(
            "#side-perfil"
        );


    if (!sidePerfil) {

        console.warn(
            "side-perfil não encontrado."
        );

        return;
    }


    /* ----------------------------------------------------------------------
       MOVER CABEÇALHO PARA A ESQUERDA
       ---------------------------------------------------------------------- */

    const heading =
        sidePerfil.querySelector(
            ".sidebar-heading"
        );


    if (
        heading
        &&
        heading.parentElement
        !== leftPanel
    ) {

        leftPanel.appendChild(
            heading
        );
    }


    /* ----------------------------------------------------------------------
       MOVER DONUTS PARA A ESQUERDA
       ---------------------------------------------------------------------- */

    const donuts =
        sidePerfil.querySelector(
            ".donut-grid"
        );


    if (
        donuts
        &&
        donuts.parentElement
        !== leftPanel
    ) {

        leftPanel.appendChild(
            donuts
        );
    }


    /* ----------------------------------------------------------------------
       Garantir que a coluna direita tenha os gráficos de barra
       ---------------------------------------------------------------------- */

    const profileSections =
        sidePerfil.querySelectorAll(
            ".profile-section"
        );


    profileSections.forEach(
        section => {

            section.style.width =
                "100%";
        }
    );


    /* ----------------------------------------------------------------------
       Redimensionar Plotly depois da mudança de posição
       ---------------------------------------------------------------------- */

    setTimeout(
        () => {

            const ids = [

                "mapa",

                "pie-severidade",

                "pie-urgencia",

                "pie-probabilidade",

                "pie-periodo",

                "bar-acao",

                "bar-tipos",

                "linha"
            ];


            ids.forEach(
                id => {

                    const el =
                        document.getElementById(
                            id
                        );


                    if (
                        el
                        &&
                        el._fullLayout
                    ) {

                        try {

                            Plotly.Plots.resize(
                                el
                            );

                        }

                        catch(error) {

                            console.warn(
                                `Resize não necessário: ${id}`,
                                error
                            );
                        }
                    }
                }
            );


            window.dispatchEvent(
                new Event(
                    "resize"
                )
            );

        },
        500
    );
}


/* --------------------------------------------------------------------------
   Rodar quando o HTML estiver disponível
   -------------------------------------------------------------------------- */

if (
    document.readyState
    ===
    "loading"
) {

    document.addEventListener(

        "DOMContentLoaded",

        () => {

            organizarPerfilTresColunas();

        }
    );

} else {

    organizarPerfilTresColunas();
}


/* --------------------------------------------------------------------------
   Reforçar depois que os dados iniciais terminarem de carregar.
   Isso não altera os dados; serve apenas para garantir o layout.
   -------------------------------------------------------------------------- */

setTimeout(
    organizarPerfilTresColunas,
    1200
);


setTimeout(
    organizarPerfilTresColunas,
    2500
);


/* ===== FIM LAYOUT JS 3 COLUNAS ===== */

