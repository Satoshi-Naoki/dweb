<template>
  <v-card dark color="#1D212E">
    <v-card-text class="wrapper">
      <p class="action-label">Withdraw</p>
      <div class="wallet-balance mb-2">
        <span>Max Withdrawable:</span>
        <v-spacer></v-spacer>
        <span class="balance" @click="fillAmount(maxWithdraw)"
          >{{ maxWithdraw.toFixed(2) }} {{ token }}</span
        >
      </div>
      <v-text-field
        class="amount-input"
        label="Withdrawal Amount"
        :suffix="token"
        v-model="withdrawValue"
        height="43"
        color="#C074F9"
        :hint="tokenConversion"
        persistent-hint
      ></v-text-field>
      <div class="borrow-power">
        <span class="label">Borrow Power</span>
        <v-progress-linear
          :value="calculateBPUsed(withdrawValue)"
          rounded
          color="#C074F9"
          background-color="#E4E4E4"
          class="borrow-bar"
          height="5"
        ></v-progress-linear>
      </div>
      <div class="borrow-used">
        <div>Borrow Power Used</div>
        <v-spacer></v-spacer>
        <div>
          <span>25.0%</span>
          &rarr;
          <span class="after-calculated">{{ calculateBPUsed(withdrawValue).toFixed(1) }}%</span>
        </div>
      </div>
      <div class="borrow-total mt-1 mb-3">
        <div>Total Borrow Power</div>
        <v-spacer></v-spacer>
        <div>
          <span>$800.00</span>
          &rarr;
          <span class="after-calculated">${{ calculateTotalBP(withdrawValue).toFixed(2) }}</span>
        </div>
      </div>
      <v-divider />
      <v-btn
        large
        block
        depressed
        :disabled="withdrawValue > maxWithdraw"
        :class="withdrawValue > maxWithdraw ? 'submit-btn disabled' : 'submit-btn'"
      >
        {{ withdrawValue > maxWithdraw ? 'Insufficient' : 'Withdraw' }}</v-btn
      >
    </v-card-text>
  </v-card>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { CurrencyRate } from '@/types/currency'

@Component({})
export default class Withdraw extends Vue {
  @Prop() token!: string

  currencyRate: CurrencyRate = {
    ECOC: 1,
    USDT: 1,
    ETH: 10
  }

  val = 25
  minVal = 25
  withdrawValue = 0
  maxWithdraw = 500

  get supplyBalance() {
    return 1000
  }

  get borrowBalance() {
    return 200
  }

  get borrowPowerPercentage() {
    return 0.8
  }

  get tokenConversion() {
    return `${this.withdrawValue} ${this.token} ≈ $${this.currencyRate[this.token] *
      Number(this.withdrawValue)}`
  }

  limitValue(num: number) {
    if (this.val < num) {
      this.val = num
    }
  }

  fillAmount(amount: number) {
    this.withdrawValue = amount
  }

  // BP = Borrow Power
  calculateTotalBP(withdrawAmount: number) {
    const dollarsAmount = Number(withdrawAmount) * this.currencyRate[this.token]
    return (this.supplyBalance - dollarsAmount) * this.borrowPowerPercentage
  }

  calculateBPUsed(withdrawAmount: number) {
    const dollarsAmount = Number(withdrawAmount) * this.currencyRate[this.token]
    return (this.borrowBalance / this.calculateTotalBP(withdrawAmount)) * 100
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  padding: 2rem;
  text-align: left;
}

.action-label {
  font-size: large;
  color: #c074f9;
  font-weight: 700;
  margin-bottom: 2rem;
}

.wallet-balance {
  display: flex;
  color: white;

  .balance {
    text-decoration: underline;
    cursor: pointer;
  }
}

.borrow-power {
  margin-top: 1rem;
  .label {
    font-weight: 700;
    color: white;
  }

  .borrow-bar {
    margin-top: 8px;
    margin-bottom: 12px;
  }
}

.borrow-total,
.borrow-used {
  display: flex;
  color: white;

  .after-calculated {
    color: #c074f9;
  }
}

.submit-btn {
  margin-top: 4.3rem;
  margin-bottom: 1.2rem;
  border-radius: 7px;
  font-weight: bold;
  background: transparent linear-gradient(90deg, #3ba7c1 0%, #59289a 100%) 0% 0% no-repeat
    padding-box;
}

.disabled {
  background: #8f8f8f !important;
  cursor: no-drop;
}
</style>

<style lang="scss">
.borrow-power {
  .v-slider--horizontal {
    min-height: 25px;
    margin: 0;
  }

  .v-slider--horizontal .v-slider__track-container {
    height: 5px;
  }

  .v-slider__thumb-container {
    border: 10px solid #1d212e;
    border-radius: 50%;
    top: 9%;
  }

  .v-slider__thumb {
    width: 16px;
    height: 16px;
    left: -8px;
  }
}
</style>