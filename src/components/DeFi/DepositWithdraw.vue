<template>
  <div class="deposit-tab elevation-2">
    <div class="label pl-3">
      <img src="@/assets/efg_logo.svg" alt="" />
      <span>{{ staked.currency.name || '###' }} - {{ $t('views.stakingpage.flexible_s') }}</span>
    </div>
    <small class="pl-3">
      {{ $t('views.stakingpage.deposit') }} {{ staked.currency.name }}
      {{ $t('views.stakingpage.to_earn') }} {{ rewardCurrencyName }}
    </small>

    <div class="total-balance">
      <span>{{ $t('views.stakingpage.yourbalance') }}</span>
      <v-spacer></v-spacer>
      <span class="text-right">{{ balance }} {{ staked.currency.name }}</span>
    </div>

    <div class="minimum-d">
      <small class="value">{{ staked.currency.name }} {{ $t('views.stakingpage.deposit') }}</small>
      <v-spacer></v-spacer>
      <small class="all" @click="fillAmountDeposit(balance)">{{
        $t('views.stakingpage.depositall')
      }}</small>
    </div>

    <v-text-field
      dark
      type="number"
      pattern="[0-9]*"
      class="deposit-amount"
      placeholder="0"
      :prefix="depositAmount ? '' : stakingpage.depositamount"
      v-model="depositAmount"
      :suffix="staked.currency.name"
      single-line
      solo
      hide-details="true"
    ></v-text-field>

    <div class="note">
      <small>{{ $t('views.stakingpage.note') }}</small>
    </div>

    <v-btn
      dark
      large
      block
      class="btn-d"
      :loading="!!onPendingDeposit || !!onPendingStop"
      :class="isTransferable(depositAmount, balance) ? '' : 'disabled'"
      :disabled="!isTransferable(depositAmount, balance)"
      @click="deposit"
      >{{ $t('views.stakingpage.deposit') }}</v-btn
    >
    <TransactionConfirmationModal
      :visible="confirmTxModal"
      :fromAddr="fromAddr"
      :toAddr="toAddr"
      :amount="amount"
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
import StakingModule from '@/store/staking'
import { WalletParams } from '@/services/ecoc/types'
import * as constants from '@/constants'
import TransactionConfirmationModal from '@/components/modals/TransactionConfirmation.vue'
import Loading from '@/components/modals/loading.vue'
import { StakingInfo } from '@/types/staking'

@Component({
  components: {
    TransactionConfirmationModal,
    Loading
  }
})
export default class DepositWithdraw extends Vue {
  walletStore = getModule(WalletModule)
  stakingStore = getModule(StakingModule)

  @Prop({ default: 0 }) readonly balance!: number
  @Prop() selectedStaking!: StakingInfo

  TYPE_DEPOSIT = 'deposit'
  TYPE_WITHDRAW = 'withdraw'

  actionType = ''
  confirmTxModal = false
  loading = false
  loadingMsg = ''
  errorMsg = ''

  fromAddr = ''
  toAddr = ''

  depositAmount: string | number = ''
  withdrawAmount: string | number = ''

  amount: string | number = 0

  get onPendingDeposit() {
    return this.walletStore.pendingTransactions.find(tx => {
      return tx.actionType === constants.ACTION_DEPOSIT && tx.status === constants.STATUS_PENDING
    })
  }

  get currency() {
    const stakingCurrency = this.walletStore.currenciesList.find(currency => {
      if (this.stakedAddr && currency.tokenInfo) {
        return this.stakedAddr === currency.tokenInfo.address
      }

      return this.selectedStaking.currency.name === currency.name
    })

    return stakingCurrency || {}
  }

  get staked() {
    return this.selectedStaking
  }

  get stakedAddr() {
    return this.selectedStaking.currency.contractAddress || ''
  }

  get walletAddr() {
    return this.walletStore.address
  }

  get contractAddr() {
    return this.stakingStore.address
  }

  get rewardCurrencyName() {
    return 'GPT'
  }

  get stakingpage() {
    return this.$t('views.stakingpage')
  }

  get onPendingStop() {
    return this.walletStore.pendingTransactions.find(tx => {
      return tx.actionType === constants.ACTION_STOP && tx.status === constants.STATUS_PENDING
    })
  }

  fillAmountDeposit(amount: number) {
    this.depositAmount = amount
  }

  fillAmountWithdraw(amount: number) {
    this.withdrawAmount = amount
  }

  openConfirmTxModal() {
    this.confirmTxModal = !this.confirmTxModal
  }

  closeConfirmTxModal() {
    this.fromAddr = ''
    this.toAddr = ''
    this.amount = 0
    this.depositAmount = 0
    this.withdrawAmount = 0
    this.actionType = ''
    this.confirmTxModal = false
  }

  deposit() {
    this.actionType = this.TYPE_DEPOSIT
    this.amount = this.depositAmount
    this.fromAddr = this.walletAddr
    this.toAddr = this.contractAddr
    this.openConfirmTxModal()
  }

  onSuccess() {
    this.loading = false
    this.loadingMsg = ''
    this.closeConfirmTxModal()
    window.scrollTo(0, 0)
  }

  onError(errorMsg: string) {
    this.errorMsg = errorMsg
    this.loading = false
    this.loadingMsg = ''
  }

  onConfirm(walletParams: WalletParams) {
    this.loading = true

    const amount = Number(this.amount)
    const payload = {
      amount,
      walletParams
    }

    if (this.actionType === this.TYPE_DEPOSIT) {
      this.loadingMsg = 'Currency Approving...'
      this.stakingStore
        .deposit(payload)
        .then(txid => {
          setTimeout(() => {
            this.walletStore.addPendingTx({
              txid: txid,
              txType: constants.TX_DEPOSIT,
              actionType: constants.ACTION_DEPOSIT
            })
            this.onSuccess()
          }, 1000)
        })
        .catch(error => {
          this.onError(error.message)
        })
    }
  }

  isTransferable(amount: number, balance: number) {
    // if active = can transfer
    if (this.staked.status) {
      return amount > 0 && amount <= balance
    } else {
      return false
    }
  }
}
</script>

<style lang="scss" scoped>
.deposit-tab {
  display: flex;
  flex-wrap: wrap;
  border-radius: 5px;
  background: #2e3344;
  padding: 16px;
  width: -webkit-fill-available;
}

.label {
  flex-basis: 100%;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  font-size: 16px;
  color: white;
  font-weight: bold;
  img {
    width: 24px;
    margin-right: 0.5rem;
  }
}

.d-amount,
.total-balance {
  width: -webkit-fill-available;
  height: fit-content;
  margin-top: 0.6rem;
  font-size: 14px;
  display: flex;
  padding: 10px;
  border: 1px solid #ffffff15;
  text-transform: uppercase;
  font-weight: 800;
  color: white;
  border-radius: 5px;
}

.minimum-w,
.minimum-d {
  height: fit-content;
  width: -webkit-fill-available;
  display: flex;
  margin: auto;
  padding: 0 10px;
  .value {
    text-align: left;
    opacity: 0.7;
  }

  .all {
    text-decoration: underline;
    cursor: pointer;
    color: white;
    text-align: right;
  }
}

.withdrawal-amount,
.deposit-amount {
  width: -webkit-fill-available;
  text-align: right;
}

.note {
  padding: 0 10px;
  opacity: 0.7;
}

.description {
  padding-left: 12px;
}

.btn-w,
.btn-d {
  margin-top: auto;
  margin-bottom: 1rem;
  border-radius: 5px;
  background: transparent linear-gradient(90deg, #8b41d6 0%, #6800fe 100%) 0% 0% no-repeat
    padding-box;
}

.disabled {
  background: rgba(255, 255, 255, 0.12) !important;
}

@media (max-width: 1264px) {
  .total-balance {
    margin-top: 2rem;
  }

  .minimum-d {
    padding: 2rem 10px 0.5rem;
  }

  .note {
    padding: 10px 10px 4rem;
  }
}

@media (max-width: 425px) {
  .withdrawal-amount,
  .d-amount,
  .minimum-w,
  .description,
  .note,
  .minimum-d,
  .deposit-amount,
  .total-balance,
  .label {
    font-size: small;
    span {
      font-size: small;
    }
  }
}
</style>

<style lang="scss">
.dw-tabs {
  .v-tabs-items {
    background-color: transparent !important;
  }

  .v-tab--active {
    background: #2e3344 !important;
  }
}

.withdrawal-amount,
.deposit-amount {
  .v-input__slot {
    padding: 0 1.3rem !important;
    background: #23262f !important;
    box-shadow: none !important;
  }
  .v-text-field__prefix {
    opacity: 0.6;
  }

  .v-text-field__suffix {
    padding-left: 8px;
  }

  input {
    text-align: right;
  }

  input:-internal-autofill-selected {
    appearance: menulist-button;
    background-color: transparent !important;
    background-image: none !important;
    color: #c074f9 !important;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield; /* Firefox */
  }
}
</style>
