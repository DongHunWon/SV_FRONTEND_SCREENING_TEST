## StradVision Frontend Screening Test

### Overview

This project is a boilerplate for StradVision Frontend screening test. It provides a starting point for candidates to showcase their frontend development skills. The boilerplate includes a basic folder structure, configuration files, and some initial code setup. Candidates can build upon this boilerplate to complete the screening test tasks and demonstrate their abilities in HTML, CSS, and JavaScript. Good luck with the test👍

### Getting Started

Follow these instructions to set up and run the project.

#### Prerequisites

- Node.js (version > 20) and npm installed on your machine.

#### Steps

1. Clone the repository.
2. Install the dependencies
3. Run the development server

### Submission

- Ensure your code is clean, well-documented, and follows best practices.
- Submit the project repository link or zip file and any additional notes in the README.md.

### 고려 사항

1. Problem solving 1

- 낙하 실험에서 고려해야할 사항은 중력 가속도, 공기 저항, 높이, 물체 등 고려할 사항이 많아 공기저항을 제외하고 높이, 중력 가속도만 조절할 수 있게 기능 구현 하였습니다.
- 타이머 17ms 쓰는 이유
  - 렌더링 지연 시간을 고려하여 자연스럽고 자연스러운 애니메이션을 생성하는 데 도움이 되며, 이를 통해 60프레임당 1초의 업데이트를 달성할 수 있습니다.
- 키보드 연속 3번 클릭 감지방법
  - 처음 기능을 구현 했을 때 스페이스를 연타로 여러번 누르면 2번(실행), 3번(초기화)가 연속으로 실행되는 버그가 발생하여 고민하다가 타이머를 두었고 threshold 값으로 사용자가 자연스럽게 실행할 수 있도록 구현하였습니다.
- 라이브러리를 안 쓴 이유
  - road-observer 페이지에서 라이브러리를 사용할 것이기 때문에 라이브러리 없이 dom을 조작할 수 있다는 것을 보여주고 싶었습니다.

2. Problem solving 2
- 라이브러리 선택
   - svg.js는 객체마다 dom을 생성하기 때문에 도로 위 차가 많은 경우 canvas 보다 성능이 떨어져 canvas를 사용하게 되었고 Konva.js가 canvas API 보다 성능이 좋다고 하여 Konva.js를 사용하였습니다.
- 차량이 시야각내에 들어오는지 체크
   - observer 차량 기준으로 각 차량에 좌표값에 위치를 각도로 계산하여 시야각에 들어와 있는지 확인을 하였습니다.
   - 시야각이 부채꼴로 되어 있기 때문에 observer 차량 기준으로 사분면으로 나누어 계산하였습니다.
   - 차량의 진행방향, 시야각에 따라서 각각 조건을 나누어 하였더니 로직을 보기가 너무 어려워 구역을 나누고 해당 구역에서 차량과 시야각 범위에 따라 경우의 수를 두어 진행방향에 따라 색상과 투명도를 적용하였습니다.
