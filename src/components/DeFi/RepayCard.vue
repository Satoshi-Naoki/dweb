<template>
  <div>
    <p class="action-label" v-if="!isMobileDevice">{{ $t('views.lendingpage.repay') }}</p>
    <div class="repay-summary">
      <div class="wallet-balance">
        <span>{{ $t('views.lendingpage.wallet_bl') }}</span>
        <v-spacer class="space"></v-spacer>
        <span class="balance" @click="fillAmount(walletBalance)"
          >{{ walletBalance.toFixed(8) }} {{ currencyName }}</span
        >
      </div>
      <div class="debt">
        <span>{{ $t('views.lendingpage.debt') }}</span>
        <v-spacer class="space"></v-spacer>
        <span class="balance">{{ debt.toFixed(8) }} {{ currencyName }}</span>
      </div>
    </div>

    <v-text-field
      class="amount-input"
      :label="lendingpage.repayamount"
      placeholder="0"
      v-model="repayAmount"
      :suffix="currencyName"
      type="number"
      pattern="[0-9]*"
      height="43"
      dark
      color="#C074F9"
      :hint="tokenConversion"
      persistent-hint
    ></v-text-field>
    <div class="borrow-power">
      <span class="label">{{ $t('views.lendingpage.borrow_po') }}</span>
      <v-progress-linear
        :value="calculateBPUsed(repayAmount)"
        rounded
        color="#C074F9"
        background-color="#E4E4E4"
        class="borrow-bar"
        height="5"
      ></v-progress-linear>
    </div>
    <div class="borrow-used">
      <div>{{ $t('views.lendingpage.borrow_power_used') }}</div>
      <v-spacer class="space"></v-spacer>
      <div class="bp-change">
        <span>{{ bpUsed.toFixed(1) }}%</span>
        &rarr;
        <span class="after-calculated">{{ calculateBPUsed(repayAmount).toFixed(1) }}%</span>
      </div>
    </div>
    <div class="borrow-total mt-1 mb-3">
      <div class="text-left">{{ $t('views.lendingpage.total_borrowed') }}</div>
      <v-spacer class="space"></v-spacer>
      <div class="bt-change">
        <span>${{ borrowBalance.toFixed(2) }}</span>
        &rarr;
        <span class="after-calculated">${{ calculateDebt(repayAmount).toFixed(2) }}</span>
      </div>
    </div>
    <v-divider dark />
    <div class="borrow-apy">
      <span class="label">{{ $t('views.lendingpage.borrowAPY') }}</span>
      <v-spacer></v-spacer>
      <span>{{ interestRate }} %</span>
    </div>
    <v-btn
      dark
      large
      block
      depressed
      :loading="!!onPendingTx"
      :disabled="!isRepayable(repayAmount, 'error')"
      :class="isRepayable(repayAmount, 'error') ? 'submit-btn' : 'submit-btn disabled'"
      @click="openConfirmTxModal"
      >{{
        isRepayable(repayAmount, 'btn') ? lendingpage.repay : $t('views.lendingpage.insufficient')
      }}
      <template v-slot:loader>
        <v-progress-circular indeterminate :size="24" class="spinner"></v-progress-circular>
        <span class="ml-2" v-if="!isRepayPendingType">{{ $t('views.lendingpage.waiting') }}</span>
      </template>
    </v-btn>
    <TransactionConfirmationModal
      :visible="confirmTxModal"
      :fromAddr="walletAddr"
      :toAddr="contractAddr"
      :amount="repayAmount"
      :currency="currency"
      @onConfirm="onConfirm"
      @onClose="closeConfirmTxModal"
    />
    <Loading :msg="loadingMsg" :loading="loading" @onClose="loading = false" />
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { getModule } from 'vuex-module-decorators'
import WalletModule from '@/store/wallet'
import LendingModule from '@/store/lending'
import { Currency } from '@/types/currency'
import { WalletParams } from '@/services/ecoc/types'
import * as constants from '@/constants'
import TransactionConfirmationModal from '@/components/modals/TransactionConfirmation.vue'
import Loading from '@/components/modals/loading.vue'

@Component({
  components: {
    TransactionConfirmationModal,
    Loading
  }
})
export default class RepayCard extends Vue {
  walletStore = getModule(WalletModule)
  lendingStore = getModule(LendingModule)

  @Prop() currency!: Currency
  @Prop() borrowBalance!: number
  @Prop() borrowLimit!: number
  @Prop() interestRate!: number

  confirmTxModal = false
  loading = false
  errorMsg = ''
  loadingMsg = 'Currency Approving...'
  repayAmount: number | string = ''
  isMobileDevice = false

  mounted() {
    this.isMobileDevice = window.innerWidth < 1264
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    window.addEventListener('resize', function() {
      self.isMobileDevice = this.window.innerWidth < 1264
    })
  }

  get isLoggedIn() {
    return this.walletStore.isWalletUnlocked
  }

  get walletAddr() {
    return this.walletStore.address
  }

  get contractAddr() {
    return this.lendingStore.address
  }

  get walletBalance() {
    return Number(this.currency.balance)
  }

  get currencyName() {
    return this.currency.name
  }

  get currencyPrice() {
    return this.currency.price || 0
  }

  get debt() {
    const total = this.lendingStore.borrowBalance * (1 + this.interestRate / 1440)
    return Number(total.toFixed(8))
  }

  get bpUsed() {
    return (this.borrowBalance / this.borrowLimit) * 100 || 0
  }
  get lendingpage() {
    return this.$t('views.lendingpage')
  }

  get tokenConversion() {
    return `${Number(this.repayAmount)} ${this.currencyName} ≈ $${this.currencyPrice *
      Number(this.repayAmount)}`
  }

  get onPendingTx() {
    const pendingList = [
      constants.ACTION_COLLATERAL,
      constants.ACTION_WITHDRAW,
      constants.ACTION_BORROW,
      constants.ACTION_REPAY,
      constants.ACTION_LIQUID_DEPOSIT,
      constants.ACTION_ASSETS_WITHDRAW
    ]
    return this.walletStore.pendingTransactions.find(tx => {
      return pendingList.includes(tx.actionType || '') && tx.status === constants.STATUS_PENDING
    })
  }

  get isRepayPendingType() {
    return this.walletStore.pendingTransactions.find(tx => {
      return tx.actionType === constants.ACTION_REPAY && tx.status === constants.STATUS_PENDING
    })
  }

  fillAmount(amount: number) {
    if (amount >= this.debt) {
      this.repayAmount = this.debt
    } else {
      this.repayAmount = amount
    }
  }

  calculateDebt(repayAmount: number) {
    return (this.debt - repayAmount) * this.currencyPrice
  }

  calculateBPUsed(repayAmount: number) {
    const dollarsAmount = Number(repayAmount) * this.currencyPrice
    const newBpUsed = ((this.borrowBalance - dollarsAmount) / this.borrowLimit) * 100
    return newBpUsed || 0
  }

  isRepayable(amount: number, type: string) {
    const isInRange = amount <= this.walletBalance && amount <= this.debt
    const isValidAmount = amount >= 0
    const isClickable = amount > 0

    if (!this.isLoggedIn) {
      return false
    }

    if (type === 'error') {
      return isInRange && isClickable
    }
    return isInRange && isValidAmount
  }

  openConfirmTxModal() {
    this.confirmTxModal = !this.confirmTxModal
  }

  closeConfirmTxModal() {
    this.repayAmount = 0
    this.confirmTxModal = false
  }

  onSuccess() {
    this.loading = false
    this.closeConfirmTxModal()
    window.scrollTo(0, 0)
  }

  onError(errorMsg: string) {
    this.loading = false
    this.errorMsg = errorMsg
  }

  onConfirm(walletParams: WalletParams) {
    this.loading = true
    const amount = Number(this.repayAmount)
    const currency = this.currency

    const payload = {
      currency,
      amount,
      walletParams
    }

    this.lendingStore
      .repay(payload)
      .then(txid => {
        this.walletStore.addPendingTx({
          txid: txid,
          txType: constants.TX_REPAY,
          actionType: constants.ACTION_REPAY
        })
        this.onSuccess()
      })
      .catch(error => {
        this.onError(error.message)
      })
  }
}
</script>

<style lang="scss" scoped>
.repay-card {
  width: inherit;
}

.wrapper {
  text-align: left;
  padding: 2rem;
}

.repay-summary {
  border-radius: 5px;
  margin-bottom: 0.5rem;
}

.action-label {
  font-size: large;
  color: #c074f9;
  font-weight: 700;
}

.debt,
.borrow-apy,
.wallet-balance {
  display: flex;
  color: white;

  .balance {
    text-align: right;
    text-decoration: underline;
    cursor: pointer;
  }

  .label {
    font-weight: 700;
  }
}

.debt {
  opacity: 0.5;
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

  .bp-change,
  .bt-change {
    text-align: right;
  }

  .after-calculated {
    color: #c074f9;
  }
}

.borrow-apy {
  margin-top: 0.5rem;
}

.submit-btn {
  margin-top: 3.6rem;
  border-radius: 7px;
  font-weight: bold;
  background: transparent linear-gradient(90deg, #9c26df 0%, #661b91 100%) 0% 0% no-repeat
    padding-box;
}

.disabled {
  background: #8f8f8f !important;
  cursor: no-drop;
}

@media (max-width: 768px) {
  .wallet-balance,
  .borrow-power,
  .borrow-used,
  .borrow-total,
  .borrow-apy,
  .debt {
    font-size: small;
  }
}

@media (max-width: 425px) {
  .debt,
  .wallet-balance {
    flex-wrap: wrap;

    .balance {
      width: 100%;
    }
  }

  .borrow-used {
    flex-wrap: wrap;

    .bp-change {
      width: 100%;
    }
  }

  .borrow-total {
    flex-wrap: wrap;

    .bt-change {
      width: 100%;
    }
  }

  .space {
    flex-basis: 100%;
  }
}
</style>
