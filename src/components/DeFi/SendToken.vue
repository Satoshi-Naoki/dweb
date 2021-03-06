<template>
  <v-card class="send-token" dark color="#1D212E">
    <v-toolbar class="send-head" flat dense>
      <v-toolbar-title>
        <v-icon class="head-icon">arrow_circle_up</v-icon>
        <span>{{ $t('views.walletpage.send') }}</span>
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text class="text-center send-area">
      <div class="token-balance">
        <span class="text-left"
          >{{ selectedCurrencyName }} {{ $t('views.walletpage.balance') }}</span
        >
        <v-spacer></v-spacer>
        <span class="text-right"
          >{{ Number(selectedCurrencyBalance) | numberWithCommas({ fixed: [0, 8] }) }}
          {{ selectedCurrencyName }}</span
        >
      </div>
      <v-text-field
        ref="toAddrRef"
        :label="walletpage.to_Address"
        class="to-address-field"
        single-line
        solo
        hide-details="true"
        v-model="toAddr"
      >
        <template v-slot:append-outer>
          <div class="address-book" @click="displayContactList">
            <v-icon>book</v-icon>
          </div>
        </template>
      </v-text-field>
      <div class="contact-address" v-if="displayContact" v-click-outside="onClickOutside">
        <v-list-item-group color="#363a4a" class="address-list">
          <template v-if="'created' in contactList">
            <div class="empty-message">{{ $t('views.walletpage.no_contact_address') }}</div>
          </template>

          <template v-else>
            <v-list-item
              v-for="(contact, index) in contactList"
              :key="index"
              class="address-item"
              @click="selectAddress(contact.address)"
            >
              <v-icon class="mr-3">account_circle</v-icon>

              <v-list-item-content>
                {{ contact.name }}
                <small class="addr-value text-truncate">{{ contact.address }}</small>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list-item-group>
      </div>
      <div class="withdraw-rate">
        <v-spacer></v-spacer>
        <span class="fb-btn" @click="withdrawAll(selectedCurrencyBalance)">{{
          $t('views.walletpage.withdraw_a')
        }}</span>
      </div>
      <v-text-field
        ref="amountRef"
        class="withdraw-amount"
        placeholder="0"
        :prefix="walletpage.amount"
        v-model="amount"
        :suffix="selectedCurrencyName"
        single-line
        solo
        type="number"
        pattern="[0-9]*"
        hide-details="true"
      ></v-text-field>
      <v-btn
        depressed
        block
        large
        class="send-btn"
        :disabled="!isSendable"
        @click="onOpenModal()"
        >{{ $t('views.walletpage.send') }}</v-btn
      >
      <TransactionConfirmationModal
        :visible="confirmTxModal"
        :fromAddr="fromAddr"
        :toAddr="toAddr"
        :amount="amount"
        :currency="selectedCurrency"
        @onConfirm="onConfirm"
        @onClose="onClose"
      />
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import vClickOutside from 'v-click-outside'
import { getModule } from 'vuex-module-decorators'
import WalletModule from '@/store/wallet'
import { SendPayload } from '@/types/wallet'
import AddressBookModule from '@/store/address-book'
import { WalletParams } from '@/services/ecoc/types'
import * as constants from '@/constants'
import TransactionConfirmationModal from '@/components/modals/TransactionConfirmation.vue'

@Component({
  components: {
    TransactionConfirmationModal
  },
  directives: {
    clickOutside: vClickOutside.directive
  }
})
export default class SendToken extends Vue {
  confirmTxModal = false

  addressStore = getModule(AddressBookModule)
  walletStore = getModule(WalletModule)
  displayContact = false

  toAddr = ''
  amount: number | string = ''
  errorMsg = ''

  addrList = [
    {
      name: 'MXC',
      address: 'EJDKiMpQvUfHK5KKiKWoe3CT2Sm9CCWaVV'
    },
    {
      name: 'Bitrex',
      address: 'EJDKiMpQvUfHK5KKiKWoe3CT2Sm9CCWaVV'
    }
  ]

  get fromAddr() {
    return this.walletStore.address || ''
  }

  get isWalletReady() {
    return this.walletStore.isWalletUnlocked
  }

  get contactList() {
    return this.addressStore.addressBook
  }

  get ecocBalance() {
    return this.walletStore.ecoc
  }

  get selectedCurrencyName() {
    return this.selectedCurrency?.name || ''
  }

  get selectedCurrencyBalance() {
    return this.selectedCurrency?.balance || ''
  }

  get selectedCurrency() {
    return this.walletStore.selectedCurrency
  }

  get walletpage() {
    return this.$t('views.walletpage')
  }

  get isSendable() {
    return !!this.toAddr && !!this.amount && this.walletStore.isWalletUnlocked
  }

  selectAddress(addr: string) {
    this.toAddr = addr
    this.displayContact = false
  }

  onClickOutside() {
    this.displayContact = false
  }

  onOpenModal() {
    if (!this.toAddr) {
      const toAddrRef: any = this.$refs.toAddrRef
      toAddrRef.focus()
      return false
    }

    if (!this.amount) {
      const amountRef: any = this.$refs.amountRef
      amountRef.focus()
      return false
    }

    this.confirmTxModal = !this.confirmTxModal
  }

  closeModal() {
    this.confirmTxModal = false
  }

  onSuccess() {
    this.toAddr = ''
    this.amount = 0
    this.closeModal()
    window.scrollTo(0, 0)
  }

  onError(errorMsg: string) {
    this.errorMsg = errorMsg
  }

  onConfirm(walletParams: WalletParams) {
    const payload = {
      currency: this.selectedCurrency,
      to: this.toAddr,
      amount: Number(this.amount),
      walletParams: walletParams
    } as SendPayload
    this.currencySend(payload)
  }

  currencySend(payload: SendPayload) {
    this.walletStore
      .send(payload)
      .then(txid => {
        this.walletStore.updateBalance()
        this.walletStore.addPendingTx({ txid: txid, txType: constants.TX_TRANSFER })
        this.onSuccess()
      })
      .catch(error => {
        this.onError(`ERROR__ ${error.message}`)
      })
  }

  onClose() {
    this.closeModal()
  }

  withdrawAll(amount: number) {
    this.amount = amount
  }

  displayContactList() {
    if (this.isWalletReady) {
      this.displayContact = !this.displayContact
    }
  }
}
</script>

<style lang="scss" scoped>
.send-token {
  width: 100%;
}

.send-head {
  background: transparent linear-gradient(270deg, #2b3043 0%, #333848 100%) 0% 0% no-repeat
    padding-box;

  span {
    font-size: 16px;
  }

  .head-icon {
    font-size: 20px;
    margin-right: 0.5rem;
  }
}

.address-book {
  background: #474d5d;
  padding: 12px;
  border-top-left-radius: 0;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  border-bottom-left-radius: 0;
  cursor: pointer;
}

.address-book:hover {
  background: #5e657b;
  transition: 0.3s;
}

.to-address-field {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  background: #363a4a;
  margin: 0;
  border: 0;
}

.token-balance {
  padding: 1rem 8px;
  display: flex;
  color: white;
}

.withdraw-rate {
  display: flex;
  padding: 10px 8px;
  font-size: small;

  .fb-btn {
    text-decoration: underline;
    color: white;
    cursor: pointer;
    text-align: right;
  }
}

.withdraw-amount {
  text-align: right;
}

.withdraw-fee {
  display: flex;
  padding: 1.5rem 8px 8px 8px;
  color: white;

  .fee-value {
    opacity: 0.7;
  }
}

.total-withdraw {
  padding: 1rem;
  display: flex;
  background: #ffffff08;
  color: white;
  border-radius: 5px;
}

.send-btn {
  margin-bottom: 3rem;
  margin-top: 9rem;
  background-color: #363a4a !important;
  color: #c074f9;
  font-weight: bold;
}

.contact-address {
  box-shadow: 0px 7px 8px 0px #1d212ebd;
  z-index: 1;
  position: absolute;
  background: #363a4a;
  width: -webkit-fill-available;
  margin-right: 2rem;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  max-height: 232px;
  overflow: auto;
}

.address-list {
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}

.address-item {
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.057);

  .addr-value {
    opacity: 0.5;
  }
}
.address-item:nth-last-child(1) {
  border-bottom: 0;
}

.empty-message {
  color: white;
  opacity: 0.4;
  padding: 1rem;
}
</style>

<style lang="scss">
.send-area {
  .v-input__slot {
    background: #363a4a !important;
    box-shadow: none !important;
  }
  .v-input__append-outer {
    margin: 0 !important;
  }
}

.withdraw-amount {
  .v-text-field__prefix {
    opacity: 0.6;
  }

  input {
    text-align: right;
  }
}
</style>

<style lang="scss">
.address-list {
  .v-list-item--active {
    background: #3d4254;
    color: white;
  }
}
v-dialog {
  border: 1pc solid red;
}

.withdraw-amount {
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
