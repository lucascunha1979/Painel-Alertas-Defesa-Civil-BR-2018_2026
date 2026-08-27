# Painel de Alertas da Defesa Civil — Anatel

Painel estático para exploração temporal, territorial e do perfil dos alertas disponibilizados pela Anatel.

## Estrutura principal

- `index.html`
- `assets/style.css`
- `assets/app.js`
- `data/`
- `data/municipios/`
- `data/perfil/`
- `data/perfil/municipios/`
- `geo/`
- `geo/municipios/`

## Interpretação

Os totais nacionais representam alertas enviados, não pessoas, usuários ou dispositivos que receberam os alertas.

Um mesmo alerta pode estar associado a vários municípios ou UFs; por isso, somas territoriais podem superar o total nacional.

A participação percentual municipal representa:

`alertas do tipo / total de alertas do município`

Assim, 1 de 1 e 23 de 23 são ambos 100%. O percentual mede composição, não volume.

A cobertura municipal por UF representa:

`municípios abrangidos / total de municípios da UF`

## Fonte

Agência Nacional de Telecomunicações — Anatel.
