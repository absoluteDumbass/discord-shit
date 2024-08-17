# Hey bro
This project is currently hardcoded to be ran for the WorldBox [Discord server](https://discord.gg/worldbox). 

The primary focus of the game is that people with higher level or rank is stronger than people with lower rank in the discord server mentioned above.

Me and the WorldBox server use [MEE6](https://mee6.xyz/en/) to manage and track the members' levels.

# Gameplay
Hey, just a heads up that this website is still in the beta stage. I'm mainly focusing on refining the code, so the info here might be **outdated, incorrect, or include future plans rather than the latest version.** I'm treating this more as a hobby than a serious work.

### You currently can:
- Annex provinces
- Share the same map with everyone
- See who controls each province
- Raise an army

### I will add:
- Color picker
- Economy with currencies
- Government reforms
- Province development
- Better mobile support
- Transfering land
- Map modes for data visualization

--------------------------
# Wiki
A temporary place for all the knowledge that you need.

If something is marked with an asterisk (`*`), then it means that it can be different from what is being said depending on specific contexts.

## Army Unit Types
The army is split into 3 units: `Infantry`, `Artilery`, `Engineer`

- Every unit takes a day to train, you may spend 2x more to make it instant.
- If you reach negative income, all of your army will disband

| Table of content | Infantry | Artilery | Engineer |
| - | :-: | :-: | :-: | 
| Cost (per day) | 0.1* | 0.2 | 0.1
| Training cost  | 1    | 2 | 2
| Siege progress | -    | 3 | 1
| Attack         | 1    | 5 | -
| Defense        | 1    | - | 3

- Siege progress is the amount of damage this type of unit does to a fort (which will be added later)
- In a battle, the Attack power will decide whether you win or lose. Defense power simply minimises your overall loss and enemy land gain.

### Infantry
The infantry is the primary unit for everything but sieging. Even then, they are essential to defend the units that are sieging. They...
- Absorbs all the damage dealt by the opponent
- Passively raise an infantry count as much as your province count (+1 per day)
- Cost nothing to maintain if equal to or smaller than your province count
- Every 1 infantry can occupy 1 province

### Artilerry
Artilery guns are massive guns. if you have a surplus and want more offensive power, artilery is the perfect unit. They...
- Are expensive to produce and maintain but overall more cost-to-damage efficient than infantry
- Excels in sieges
- Are glass cannons
- **Wll all die if the infantry dies**

### Engineer
The combat engineers helps setting up barriers and reduce damage taken from battles. They...
- Excels in defense
- Will aid in sieges
- **Will all die if the infantry dies**

## Army Estimates
When using `inspect`, it will show an estimate on how strong that person is. 
It's unreliable and calculated **purely based on their level**, but it does give you an idea on how strong a nation can be.

Equations used are:
- Infantry: `province count + (level / 2)`
- Artilery: `level / 30`
- Engineer: `level / 10`
- Invasion odds: `their level/your level`
  - Too easy: `<10%`
  - One sided: `10-39%`
  - Costly: `40-89%`
  - Insane: `90-110%`
  - Suicidal: `>111%`